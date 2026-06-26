// Tiny y-webrtc signaling relay. It ONLY brokers the WebRTC handshake between
// peers (topic-based pub/sub of SDP/ICE messages) — the actual hive edits flow
// peer-to-peer and never touch this server. Traffic is therefore tiny, so a free
// tier (Render / Fly / a Cloudflare Worker port) covers it at $0.
//
// Protocol (y-webrtc): clients send JSON {type}:
//   subscribe   {topics:[...]}   → join those topic rooms
//   unsubscribe {topics:[...]}   → leave them
//   publish     {topic, ...}     → relay the message to everyone else in `topic`
//   ping                          → server replies {type:'pong'}
//
// Run locally:   node signaling/server.js            (ws://localhost:4444)
// Configure port via PORT env (Render/Fly set it automatically).

import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 4444;
const PING_TIMEOUT = 30000;

const wss = new WebSocketServer({ port: PORT });

/** topic → Set<ws> */
const topics = new Map();

const send = (conn, msg) => {
  if (conn.readyState !== 0 && conn.readyState !== 1) return conn.close();
  try {
    conn.send(JSON.stringify(msg));
  } catch {
    conn.close();
  }
};

wss.on('connection', (conn) => {
  /** topics this connection is subscribed to */
  const subscribed = new Set();
  let alive = true;

  conn.on('pong', () => (alive = true));

  const pingTimer = setInterval(() => {
    if (!alive) {
      conn.terminate();
      clearInterval(pingTimer);
      return;
    }
    alive = false;
    try {
      conn.ping();
    } catch {
      conn.terminate();
    }
  }, PING_TIMEOUT);

  conn.on('close', () => {
    for (const name of subscribed) {
      const set = topics.get(name);
      set?.delete(conn);
      if (set && set.size === 0) topics.delete(name);
    }
    subscribed.clear();
    clearInterval(pingTimer);
  });

  conn.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (!message || !message.type) return;

    switch (message.type) {
      case 'subscribe':
        (message.topics || []).forEach((name) => {
          if (typeof name !== 'string') return;
          let set = topics.get(name);
          if (!set) topics.set(name, (set = new Set()));
          set.add(conn);
          subscribed.add(name);
        });
        break;
      case 'unsubscribe':
        (message.topics || []).forEach((name) => {
          topics.get(name)?.delete(conn);
          subscribed.delete(name);
        });
        break;
      case 'publish':
        if (!message.topic) return;
        topics.get(message.topic)?.forEach((receiver) => {
          if (receiver !== conn) send(receiver, message);
        });
        break;
      case 'ping':
        send(conn, { type: 'pong' });
        break;
    }
  });
});

console.log(`y-webrtc signaling relay listening on ws://localhost:${PORT}`);
