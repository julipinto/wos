<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md';
    children: Snippet;
  }

  // eslint-disable-next-line svelte/valid-compile -- rest props are fine; we don't ship as a custom element
  let { variant = 'secondary', size = 'md', children, class: cls, ...rest }: Props = $props();
</script>

<button class="btn variant-{variant} size-{size} {cls ?? ''}" {...rest}>
  {@render children()}
</button>

<style>
  .btn {
    font-family: var(--font-mono);
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-radius: var(--r-pill);
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .size-md {
    font-size: 12px;
    padding: 12px 22px;
  }
  .size-sm {
    font-size: 11px;
    padding: 8px 16px;
    letter-spacing: 1px;
  }
  .btn:hover:not(:disabled) {
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  .variant-primary {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
  }
  .variant-primary:hover:not(:disabled) {
    transform: translateX(1px);
    filter: brightness(1.05);
    background: var(--accent);
  }
  .variant-ghost {
    border-color: transparent;
    color: var(--text-mid);
  }
  .variant-ghost:hover:not(:disabled) {
    color: var(--text);
    background: var(--surface);
    border-color: transparent;
  }
  .variant-danger {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
  }
  .variant-danger:hover:not(:disabled) {
    color: #fb7185;
    background: rgba(251, 113, 133, 0.12);
    border-color: rgba(251, 113, 133, 0.6);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
</style>
