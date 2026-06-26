# Territory planner — signaling relay

A ~90-line WebSocket server that brokers **only** the WebRTC handshake between
peers (topic pub/sub of SDP/ICE). The actual hive edits flow **peer-to-peer** and
never pass through here, so traffic is tiny and a free tier is plenty.

## Run locally (for development)

```sh
cd signaling
npm install        # or: yarn
npm start          # ws://localhost:4444
```

In dev the app points at `ws://localhost:4444` automatically. Open the planner in
two browser windows, start collaboration in one, paste the room link in the other.

## Deploy for free (production)

Any host that runs a Node process and supports WebSockets works. Pick one:

### Render (easiest)
1. New → **Web Service** → connect this repo (or a copy of just `signaling/`).
2. Root directory: `signaling`. Build: `npm install`. Start: `npm start`.
3. Instance type: **Free**. Render injects `PORT` automatically.
4. Copy the service URL and use the `wss://` form, e.g. `wss://your-app.onrender.com`.
   - Note: the free tier sleeps after inactivity → the first peer to join may wait
     ~30–60s for cold start. Subsequent joins are instant.

### Fly.io / Railway
Same idea: deploy `signaling/`, expose the port, use the `wss://` URL.

### Cloudflare Workers (no cold start)
Requires porting the relay to a Durable Object (WebSocket pub/sub). Ask and I'll
provide that variant — it avoids the Render cold-start at the cost of a small rewrite.

## Wire the production URL into the app

Set the build-time env var when building the site (and in CI/GitHub Actions):

```sh
PUBLIC_SIGNALING_URL="wss://your-app.onrender.com" yarn build
```

If unset, the app falls back to `ws://localhost:4444` in dev. The URL is read in
`src/lib/tools/territory/collab.ts`.
