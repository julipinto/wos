<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import type { CollabStatus, PeerState } from './collab';

  // Presence bar for live collaboration: a start button when solo, and when in a
  // room a status dot + peer avatars + copy-link / leave controls.
  interface Props {
    active: boolean;
    status: CollabStatus;
    peers: PeerState[];
    copied: boolean;
    onStart: () => void;
    onCopy: () => void;
    onLeave: () => void;
  }
  let { active, status, peers, copied, onStart, onCopy, onLeave }: Props = $props();

  const initials = (name: string) =>
    name
      .split(/[\s-]+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
</script>

<div class="collab" class:active>
  {#if !active}
    <button class="start" type="button" onclick={onStart}>👥 {i18n.m.territory.collab.start}</button
    >
  {:else}
    <span class="status">
      <span class="dot {status}"></span>
      {i18n.m.territory.collab[status]}
    </span>
    <span class="peers" aria-label={i18n.m.territory.collab.online}>
      {#each peers as p, i (p.name + i)}
        <span class="avatar" style="background: {p.color}" title={p.name}>{initials(p.name)}</span>
      {/each}
    </span>
    <button class="act" type="button" onclick={onCopy}>
      {copied ? '✓ ' + i18n.m.territory.collab.copied : '🔗 ' + i18n.m.territory.collab.copyLink}
    </button>
    <button class="act leave" type="button" onclick={onLeave}
      >{i18n.m.territory.collab.leave}</button
    >
  {/if}
</div>

<style>
  .collab {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .collab.active {
    padding: 8px 12px;
    background: var(--surface);
    border: 1px solid var(--border-accent);
    border-radius: var(--r-card);
  }
  .start,
  .act {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 7px 14px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .start:hover,
  .act:hover {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .act.leave:hover {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.5);
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-dim);
  }
  .dot.connected {
    background: #34d399;
  }
  .dot.connecting {
    background: #fbbf24;
    animation: pulse 1s ease-in-out infinite;
  }
  .dot.disconnected {
    background: #fb7185;
  }
  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }
  .peers {
    display: inline-flex;
    align-items: center;
  }
  .avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    color: #0b1220;
    border: 2px solid var(--bg);
    margin-inline-start: -6px;
  }
  .avatar:first-child {
    margin-inline-start: 0;
  }
  .act.leave {
    margin-inline-start: auto;
  }
</style>
