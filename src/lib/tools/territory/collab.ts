// Live collaboration bridge: a Yjs CRDT shared over WebRTC (peer-to-peer data),
// using our own tiny signaling relay only for the handshake. This module is
// imported dynamically (code-split) so yjs/y-webrtc never weigh down solo use.
//
// The model: a Y.Map keyed by object id holds each PlacedObject. Local edits are
// reconciled into the map after every persist(); remote changes rebuild the local
// objects array. Concurrent moves/edits merge conflict-free via the CRDT.
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import type { PlacedObject } from './territory';

// Build-time signaling URL (set VITE_SIGNALING_URL when building for production);
// falls back to a local relay in dev (run: node signaling/server.js).
const env = import.meta.env as Record<string, string | undefined>;
const SIGNALING = env.VITE_SIGNALING_URL || 'ws://localhost:4444';
const LOCAL_ORIGIN = 'local';

export type CollabStatus = 'connecting' | 'connected' | 'disconnected';

export interface PeerState {
  name: string;
  color: string;
  selection?: string[];
}

export interface CollabOpts {
  room: string;
  user: { name: string; color: string };
  getObjects: () => PlacedObject[];
  /** Apply the room's objects locally (must NOT trigger a push back). */
  applyRemote: (objs: PlacedObject[]) => void;
  onPeers: (states: PeerState[]) => void;
  onStatus: (s: CollabStatus) => void;
}

export interface CollabSession {
  /** Reconcile the shared doc to match the local objects (call after persist). */
  pushLocal: () => void;
  /** Broadcast this peer's current selection (for live highlight — phase 3). */
  setSelection: (ids: string[]) => void;
  destroy: () => void;
}

const clone = <T>(o: T): T =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function startCollab(opts: CollabOpts): CollabSession {
  const doc = new Y.Doc();
  const omap = doc.getMap<PlacedObject>('objects');
  opts.onStatus('connecting');

  const provider = new WebrtcProvider(opts.room, doc, { signaling: [SIGNALING] });
  const aw = provider.awareness;
  aw.setLocalStateField('user', opts.user);

  // A remote apply is in flight — don't bounce the resulting local change back.
  let applying = false;

  omap.observeDeep((_events, txn) => {
    if (txn.origin === LOCAL_ORIGIN) return; // ignore our own writes (no echo loop)
    applying = true;
    try {
      opts.applyRemote([...omap.values()].map((o) => clone(o)));
    } finally {
      applying = false;
    }
  });

  function pushLocal() {
    if (applying) return;
    const local = opts.getObjects();
    const ids = new Set(local.map((o) => o.id));
    doc.transact(() => {
      for (const o of local) {
        const prev = omap.get(o.id);
        if (!prev || !eq(prev, o)) omap.set(o.id, clone(o));
      }
      for (const id of [...omap.keys()]) if (!ids.has(id)) omap.delete(id);
    }, LOCAL_ORIGIN);
  }

  // Seed the room with our board only if nobody got there first. We wait briefly
  // so a joiner receives the established state instead of clobbering it.
  const seedTimer = setTimeout(() => {
    if (omap.size === 0) pushLocal();
  }, 1500);

  const emitPeers = () => {
    const states: PeerState[] = [];
    aw.getStates().forEach((s) => {
      if (s.user) states.push({ ...(s.user as PeerState), selection: s.selection as string[] });
    });
    opts.onPeers(states);
  };
  aw.on('change', emitPeers);
  provider.on('status', (e: { connected: boolean }) =>
    opts.onStatus(e.connected ? 'connected' : 'disconnected')
  );
  provider.on('peers', emitPeers);
  emitPeers();

  return {
    pushLocal,
    setSelection: (ids: string[]) => aw.setLocalStateField('selection', ids),
    destroy: () => {
      clearTimeout(seedTimer);
      aw.off('change', emitPeers);
      provider.destroy();
      doc.destroy();
    }
  };
}
