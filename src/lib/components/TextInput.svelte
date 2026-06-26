<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  // Shared single-line text input — the standard field styling (mono, pill, accent
  // focus) in one place. Forwards every native attribute (placeholder, oninput,
  // onchange, maxlength, …) and an optional class; `value` is bindable.
  interface Props extends HTMLInputAttributes {
    value?: string;
  }
  // eslint-disable-next-line svelte/valid-compile -- rest props are fine; not a custom element
  let { value = $bindable(''), class: cls, ...rest }: Props = $props();
</script>

<input class="ti {cls ?? ''}" bind:value {...rest} />

<style>
  .ti {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 10px 14px;
  }
  .ti:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
</style>
