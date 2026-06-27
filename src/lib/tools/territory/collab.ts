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

// Signaling URL comes from the VITE_SIGNALING_URL build var (a GitHub Actions repo
// variable in production → our Cloudflare Worker; see signaling/cloudflare/). Dev
// falls back to a local relay (run: node signaling/server.js).
const env = import.meta.env as Record<string, string | undefined>;
const SIGNALING = env.VITE_SIGNALING_URL || 'ws://localhost:4444';
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
  /** Update this peer's display name / colour (after the user edits it). */
  setUser: (user: { name: string; color: string }) => void;
  destroy: () => void;
}

// JSON round-trip (not structuredClone): our objects come from Svelte 5 $state, and
// those reactive proxies are NOT structured-cloneable (DataCloneError). JSON reads
// through the proxy and yields the plain object Yjs needs to store.
const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));
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

  // The 'status' event (signaling socket) proved unreliable across browsers, so we
  // also treat "a peer/awareness is present" or "doc synced" as connected — if data
  // is flowing we're live regardless of what the signaling event reported.
  let signalingUp = false;
  const refreshStatus = () => {
    const live = signalingUp || aw.getStates().size > 1 || provider.connected;
    opts.onStatus(live ? 'connected' : 'connecting');
  };

  const emitPeers = () => {
    const states: PeerState[] = [];
    aw.getStates().forEach((s, id) => {
      const u = s.user as { name?: string; color?: string } | undefined;
      if (!u) return;
      states.push({
        id,
        self: id === aw.clientID,
        // Never trust the remote shape — a peer that connected a beat before its
        // name propagated (or an older client) must not crash avatar rendering.
        name: typeof u.name === 'string' && u.name.trim() ? u.name : 'anon',
        color: typeof u.color === 'string' && u.color ? u.color : '#94a3b8',
        selection: s.selection as string[] | undefined,
        cursor: s.cursor as { x: number; y: number } | null | undefined
      });
    });
    opts.onPeers(states);
    refreshStatus();
  };
  aw.on('change', emitPeers);
  provider.on('status', (e: { connected: boolean }) => {
    signalingUp = e.connected;
    refreshStatus();
  });
  provider.on('synced', () => {
    signalingUp = true;
    refreshStatus();
  });
  provider.on('peers', emitPeers);
  emitPeers();

  return {
    pushLocal,
    setSelection: (ids: string[]) => aw.setLocalStateField('selection', ids),
    setCursor: (p) => aw.setLocalStateField('cursor', p),
    setUser: (user) => aw.setLocalStateField('user', user),
    destroy: () => {
      aw.off('change', emitPeers);
      provider.destroy();
      doc.destroy();
    }
  };
}
