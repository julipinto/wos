<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import type { CollabStatus, PeerState } from './collab';

  // Presence bar for live collaboration: a start button when solo, and when in a
  // room a status dot + peer avatars + copy-link / leave controls.
  interface Props {
    active: boolean;
    status: CollabStatus;
    peers: PeerState[];
    copied: boolean;
    myName: string;
    myColor: string;
    /** Whether this client is the room host (crown on its own avatar). */
    iAmHost: boolean;
    onStart: () => void;
    onCopy: () => void;
    onLeave: () => void;
    onRename: (name: string) => void;
  }
  let {
    active,
    status,
    peers,
    copied,
    myName,
    myColor,
    iAmHost,
    onStart,
    onCopy,
    onLeave,
    onRename
  }: Props = $props();

  // Show only OTHER peers as avatars (you have the name input); cap the row.
  const others = $derived(peers.filter((p) => !p.self));
  const initials = (name: string | undefined) =>
    (name ?? '')
      .split(/[\s-]+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
</script>

<div class="collab" class:active>
  {#if !active}
    <Button variant="secondary" size="sm" onclick={onStart}
      >👥 {i18n.m.territory.collab.start}</Button
    >
  {:else}
    <span class="status">
      <span class="dot {status}"></span>
      {i18n.m.territory.collab[status]}
    </span>
    <label class="me" title={i18n.m.territory.collab.yourName}>
      <span class="avatar" class:host={iAmHost} style="background: {myColor}">
        {initials(myName)}
        {#if iAmHost}<span class="crown" title={i18n.m.territory.collab.host}>👑</span>{/if}
      </span>
      <TextInput
        style="width:9ch"
        value={myName}
        maxlength={18}
        aria-label={i18n.m.territory.collab.yourName}
        onchange={(e) => onRename(e.currentTarget.value)}
      />
    </label>
    <span class="peers" aria-label={i18n.m.territory.collab.online}>
      {#each others as p (p.id)}
        <span class="avatar" class:host={p.host} style="background: {p.color}" title={p.name}>
          {initials(p.name)}
          {#if p.host}<span class="crown" title={i18n.m.territory.collab.host}>👑</span>{/if}
        </span>
      {/each}
    </span>
    <Button variant="secondary" size="sm" onclick={onCopy}>
      {copied ? '✓ ' + i18n.m.territory.collab.copied : '🔗 ' + i18n.m.territory.collab.copyLink}
    </Button>
    <Button variant="danger" size="sm" onclick={onLeave} style="margin-inline-start:auto"
      >{i18n.m.territory.collab.leave}</Button
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
  .status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
  }
  .me {
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
    position: relative;
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
  .avatar.host {
    border-color: #fbbf24;
  }
  .crown {
    position: absolute;
    top: -9px;
    inset-inline-end: -5px;
    font-size: 10px;
    line-height: 1;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
  }
  .avatar:first-child {
    margin-inline-start: 0;
  }
</style>
