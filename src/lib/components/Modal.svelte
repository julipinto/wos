<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
    label?: string;
    children: Snippet;
    /** Show the X close button in the corner. Default true. */
    showClose?: boolean;
    /** Wider modal — for the tutorial. */
    wide?: boolean;
  }

  let { open, onClose, label, children, showClose = true, wide = false }: Props = $props();

  function onBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if open}
  <div
    class="overlay"
    role="dialog"
    aria-modal="true"
    aria-label={label}
    onclick={onBackdrop}
    onkeydown={(e) => {
      if (e.key === 'Enter' && e.target === e.currentTarget) onClose();
    }}
    tabindex="-1"
  >
    <div class="modal" class:wide>
      {#if showClose}
        <button class="modal-close" aria-label="Close" onclick={onClose}>
          <Icon name="x" size={14} />
        </button>
      {/if}
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(11, 14, 22, 0.6);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 150;
    padding: 18px;
  }
  .modal {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 28px;
    max-width: 420px;
    width: 100%;
    position: relative;
  }
  .modal.wide {
    max-width: 520px;
  }
  .modal-close {
    position: absolute;
    top: 14px;
    inset-inline-end: 14px;
    width: 32px;
    height: 32px;
    background: transparent;
    border: 0;
    cursor: pointer;
    color: var(--text-mid);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-close:hover {
    background: var(--surface);
    color: var(--text);
  }
  @media (max-width: 540px) {
    .modal {
      padding: 20px;
    }
  }
</style>
