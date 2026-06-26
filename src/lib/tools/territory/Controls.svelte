<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';

  // The zoom bar: −/+ stepping, a live % readout, and Fit-to-content. Display and
  // filter toggles now live in the left Rail; this stays minimal in the top bar.
  interface Props {
    zoom: number;
    onFit: () => void;
  }
  let { zoom = $bindable(), onFit }: Props = $props();

  // Keep in sync with Board.svelte's MINZ / MAXZ.
  const MINZ = 0.35;
  const MAXZ = 8;
  const STEP = 0.25;
</script>

<div class="zoom">
  <button
    class="ctl"
    type="button"
    onclick={() => (zoom = Math.max(MINZ, +(zoom - STEP).toFixed(2)))}
    disabled={zoom <= MINZ}
    aria-label="zoom out">−</button
  >
  <span class="zoom-val">{Math.round(zoom * 100)}%</span>
  <button
    class="ctl"
    type="button"
    onclick={() => (zoom = Math.min(MAXZ, +(zoom + STEP).toFixed(2)))}
    disabled={zoom >= MAXZ}
    aria-label="zoom in">+</button
  >
  <button
    class="ctl fit"
    type="button"
    onclick={onFit}
    title={i18n.m.territory.fit}
    aria-label={i18n.m.territory.fit}>⊡</button
  >
</div>

<style>
  .zoom {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ctl {
    width: 30px;
    height: 30px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-mid);
    font-size: 16px;
    cursor: pointer;
  }
  .ctl:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .ctl:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .zoom-val {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    min-width: 38px;
    text-align: center;
  }
</style>
