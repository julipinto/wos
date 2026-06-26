/* global WebSocketPair */
// y-webrtc signaling relay as a Cloudflare Worker + Durable Object.
//
// Why a Durable Object: Workers are stateless, but signaling needs a single place
// where peers' topic subscriptions live so a "publish" reaches the right sockets.
// All connections route to one DO instance ("hub") that brokers by topic. Only the
// WebRTC handshake passes through here — the hive edits flow peer-to-peer.
//
// Free tier: the DO is declared as a SQLite-backed class (see wrangler.jsonc), which
// is what makes Durable Objects available on the free Workers plan. We keep no
// storage; subscriptions ride on each socket's attachment so they survive
// hibernation (idle WebSockets don't burn quota).

export class SignalingRoom {
  constructor(state) {
    this.state = state;
  }

  async fetch() {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server); // hibernatable
    server.serializeAttachment([]); // this socket's subscribed topics
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (!msg || !msg.type) return;

    if (msg.type === 'subscribe') {
      const topics = new Set(ws.deserializeAttachment() || []);
      for (const t of msg.topics || []) if (typeof t === 'string') topics.add(t);
      ws.serializeAttachment([...topics]);
    } else if (msg.type === 'unsubscribe') {
      const topics = new Set(ws.deserializeAttachment() || []);
      for (const t of msg.topics || []) topics.delete(t);
      ws.serializeAttachment([...topics]);
    } else if (msg.type === 'publish' && msg.topic) {
      const data = JSON.stringify(msg);
      for (const sock of this.state.getWebSockets()) {
        if (sock === ws) continue;
        const topics = sock.deserializeAttachment() || [];
        if (topics.includes(msg.topic)) {
          try {
            sock.send(data);
          } catch {
            /* socket going away */
          }
        }
      }
    } else if (msg.type === 'ping') {
      try {
        ws.send(JSON.stringify({ type: 'pong' }));
      } catch {
        /* ignore */
      }
    }
  }

  webSocketClose(ws) {
    try {
      ws.close();
    } catch {
      /* already closed */
    }
  }

  webSocketError(ws) {
    try {
      ws.close();
    } catch {
      /* already closed */
    }
  }
}

export default {
  async fetch(request, env) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('y-webrtc signaling relay (Durable Object). Connect via WebSocket.', {
        status: 426
      });
    }
    const id = env.SIGNALING.idFromName('hub');
    return env.SIGNALING.get(id).fetch(request);
  }
};
