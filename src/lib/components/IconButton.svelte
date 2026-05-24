<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    label: string;
    children: Snippet;
  }

  // eslint-disable-next-line svelte/valid-compile -- rest props are fine; we don't ship as a custom element
  let { label, children, class: cls, ...rest }: Props = $props();
</script>

<button class="ibtn {cls ?? ''}" aria-label={label} title={label} {...rest}>
  {@render children()}
</button>

<style>
  .ibtn {
    width: 36px;
    height: 36px;
    border-radius: var(--r-pill);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-mid);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      border-color 0.2s ease;
    padding: 0;
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
