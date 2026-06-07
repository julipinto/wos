<script lang="ts">
  /**
   * A small segmented (pill) control — a row of mutually-exclusive options.
   * Shared so the various toggles across the app (view, board mode, label
   * field, …) look and behave the same.
   */
  interface Option {
    value: string;
    label: string;
  }
  interface Props {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    ariaLabel?: string;
  }
  let { value, options, onChange, ariaLabel }: Props = $props();
</script>

<div class="seg" role="group" aria-label={ariaLabel}>
  {#each options as o (o.value)}
    <button
      class="seg-btn"
      class:active={value === o.value}
      type="button"
      onclick={() => onChange(o.value)}>{o.label}</button
    >
  {/each}
</div>

<style>
  .seg {
    display: inline-flex;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 3px;
    gap: 2px;
  }
  .seg-btn {
    background: none;
    border: none;
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 5px 14px;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease;
  }
  .seg-btn.active {
    background: var(--bg-soft);
    color: var(--text);
  }
</style>
