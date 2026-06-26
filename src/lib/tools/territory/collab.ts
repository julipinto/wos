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

// Signaling URL: an override via VITE_SIGNALING_URL wins; otherwise dev uses a
// local relay (run: node signaling/server.js) and production uses our deployed
// Cloudflare Worker (Durable Object) — see signaling/cloudflare/.
const env = import.meta.env as Record<string, string | undefined>;
const PROD_SIGNALING = 'wss://wos-territory-signaling.aragaopintojuli.workers.dev';
const SIGNALING =
  env.VITE_SIGNALING_URL || (import.meta.env.DEV ? 'ws://localhost:4444' : PROD_SIGNALING);
const LOCAL_ORIGIN = 'local';

export type CollabStatus = 'connecting' | 'connected' | 'disconnected';

export interface PeerState {
  id: number; // awareness clientID (stable key)
  self: boolean; // this client
  name: string;
  color: string;
  selection?: string[];
  cursor?: { x: number; y: number } | null;
}

export interface CollabOpts {
  room: string;
  /** End-to-end encryption key (from the URL hash; never seen by signaling). */
  password?: string;
  /** True for the room creator (seeds the doc with the local board); joiners adopt
   *  the room's state instead of pushing their own. */
  seed: boolean;
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
  /** Broadcast this peer's current selection (drives the remote selection halos). */
  setSelection: (ids: string[]) => void;
  /** Broadcast this peer's live cursor in grid coords (null to hide). */
  setCursor: (p: { x: number; y: number } | null) => void;
  destroy: () => void;
}

const clone = <T>(o: T): T =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function startCollab(opts: CollabOpts): CollabSession {
  const doc = new Y.Doc();
  const omap = doc.getMap<PlacedObject>('objects');
  opts.onStatus('connecting');

  const provider = new WebrtcProvider(opts.room, doc, {
    signaling: [SIGNALING],
    password: opts.password,
    // STUN to discover public IPs; a free public TURN relay as a fallback for the
    // ~10–20% of peers behind symmetric NAT / strict firewalls where direct P2P fails.
    peerOpts: {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      }
    }
  });
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

  // The creator seeds the room with the local board (joiners receive it on sync).
  if (opts.seed) pushLocal();

  const emitPeers = () => {
    const states: PeerState[] = [];
    aw.getStates().forEach((s, id) => {
      const u = s.user as { name: string; color: string } | undefined;
      if (!u) return;
      states.push({
        id,
        self: id === aw.clientID,
        name: u.name,
        color: u.color,
        selection: s.selection as string[] | undefined,
        cursor: s.cursor as { x: number; y: number } | null | undefined
      });
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
    setCursor: (p) => aw.setLocalStateField('cursor', p),
    destroy: () => {
      aw.off('change', emitPeers);
      provider.destroy();
      doc.destroy();
    }
  };
}
