<script lang="ts">
  // Floating right-click menu: opaque card at (x, y), clamped on-screen,
  // dismissed on outside pointerdown / Escape / item choice.
  import { onMount } from 'svelte';

  interface MenuItem {
    label: string;
    danger?: boolean;
    onClick: () => void;
  }
  interface Props {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
  }
  let { x, y, items, onClose }: Props = $props();

  let menuEl: HTMLDivElement;
  let left = $state(0);
  let top = $state(0);
  let ready = $state(false);

  // Clamp into the viewport once the menu has been measured.
  $effect(() => {
    if (!menuEl) return;
    const { width, height } = menuEl.getBoundingClientRect();
    const pad = 8;
    let nl = x;
    let nt = y;
    if (nl + width > window.innerWidth - pad) nl = window.innerWidth - width - pad;
    if (nt + height > window.innerHeight - pad) nt = window.innerHeight - height - pad;
    left = Math.max(pad, nl);
    top = Math.max(pad, nt);
    ready = true;
  });

  function choose(item: MenuItem) {
    item.onClick();
    onClose();
  }

  onMount(() => {
    function onPointerDown(e: PointerEvent) {
      if (menuEl && !menuEl.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  });
</script>

<div
  bind:this={menuEl}
  class="ctx-menu"
  style="left: {left}px; top: {top}px; visibility: {ready ? 'visible' : 'hidden'};"
  role="menu"
>
  {#each items as item, i (i)}
    <button
      type="button"
      role="menuitem"
      class="ctx-item"
      class:danger={item.danger}
      onclick={() => choose(item)}>{item.label}</button
    >
  {/each}
</div>

<style>
  .ctx-menu {
    position: fixed;
    z-index: 200;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--bg-soft);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-card);
    padding: 6px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  }
  .ctx-item {
    width: 100%;
    box-sizing: border-box;
    text-align: left;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 12px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .ctx-item:hover {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .ctx-item.danger {
    color: #fb7185;
    border-color: transparent;
  }
  .ctx-item.danger:hover {
    border-color: rgba(251, 113, 133, 0.4);
  }
</style>
