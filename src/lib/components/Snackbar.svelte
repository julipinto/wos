<script lang="ts">
  import { snackbar } from '$lib/stores/snackbar.svelte';
</script>

<div
  class="snack"
  class:open={snackbar.open}
  class:kind-no={snackbar.kind === 'no'}
  role="status"
  aria-live="polite"
>
  <span class="icon">{snackbar.kind === 'no' ? '✕' : '✓'}</span>{snackbar.msg}
</div>

<style>
  .snack {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    padding: 12px 18px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    opacity: 0;
    pointer-events: none;
    transition:
      opacity 0.2s ease,
      transform 0.25s ease;
    z-index: 200;
    white-space: nowrap;
  }
  .snack.open {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  .icon {
    color: var(--ok);
    font-weight: bold;
  }
  .kind-no .icon {
    color: var(--no);
  }
</style>
