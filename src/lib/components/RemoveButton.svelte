<script lang="ts">
  /** The one delete control for list rows across the upgrade tools — a single
   * trash glyph so "remove" looks the same everywhere (was a mix of × and 🗑). */
  import { i18n } from '$lib/i18n/index.svelte';

  interface Props {
    onclick: () => void;
    label?: string;
  }
  let { onclick, label }: Props = $props();
  const aria = $derived(label ?? i18n.m.upgrade.troops.remove);
</script>

<button class="remove-btn" type="button" {onclick} aria-label={aria} title={aria}>🗑</button>

<style>
  .remove-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 44px;
    background: transparent;
    border: none;
    padding: 0;
    font-size: 16px;
    line-height: 1;
    color: var(--text-dim);
    opacity: 0.6;
    cursor: pointer;
    transition:
      opacity 0.2s ease,
      color 0.2s ease;
  }
  .remove-btn:hover {
    opacity: 1;
    color: #fb7185;
  }
</style>
