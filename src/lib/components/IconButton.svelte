<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    label: string;
    size?: 'sm' | 'md';
    children: Snippet;
  }

  // eslint-disable-next-line svelte/valid-compile -- rest props are fine; we don't ship as a custom element
  let { label, size = 'md', children, class: cls, ...rest }: Props = $props();
</script>

<button class="ibtn size-{size} {cls ?? ''}" aria-label={label} title={label} {...rest}>
  {@render children()}
</button>

<style>
  .ibtn {
    border-radius: var(--r-pill);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-mid);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      border-color 0.2s ease;
    padding: 0;
  }
  .size-md {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  .size-sm {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }
  .ibtn:hover:not(:disabled) {
    background: var(--surface-hover);
    color: var(--text);
    border-color: var(--border-strong);
  }
  .ibtn:disabled {
    opacity: 0.45;
    cursor: default;
  }
</style>
