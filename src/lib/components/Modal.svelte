<script lang="ts">
  import type { Snippet } from 'svelte';

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
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 3 L11 11 M11 3 L3 11"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
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
</style>
