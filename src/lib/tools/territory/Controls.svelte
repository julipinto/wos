<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import IconButton from '$lib/components/IconButton.svelte';

  // The zoom bar: −/+ stepping, a live % readout, and Fit-to-content. Display and
  // filter toggles now live in the left Rail; this stays minimal in the top bar.
  interface Props {
    zoom: number;
    /** When locked, wheel/pinch/± don't change zoom (Fit still works). */
    locked: boolean;
    onFit: () => void;
  }
  let { zoom = $bindable(), locked = $bindable(), onFit }: Props = $props();

  // Keep in sync with Board.svelte's MINZ / MAXZ.
  const MINZ = 0.35;
  const MAXZ = 8;
  const STEP = 0.25;
</script>

<div class="zoom">
  <IconButton
    label="zoom out"
    size="sm"
    onclick={() => (zoom = Math.max(MINZ, +(zoom - STEP).toFixed(2)))}
    disabled={locked || zoom <= MINZ}>−</IconButton
  >
  <span class="zoom-val">{Math.round(zoom * 100)}%</span>
  <IconButton
    label="zoom in"
    size="sm"
    onclick={() => (zoom = Math.min(MAXZ, +(zoom + STEP).toFixed(2)))}
    disabled={locked || zoom >= MAXZ}>+</IconButton
  >
  <IconButton
    label={locked ? i18n.m.territory.zoomUnlock : i18n.m.territory.zoomLock}
    size="sm"
    onclick={() => (locked = !locked)}>{locked ? '🔒' : '🔓'}</IconButton
  >
  <IconButton label={i18n.m.territory.fit} size="sm" onclick={onFit}>⊡</IconButton>
</div>

<style>
  .zoom {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .zoom-val {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    min-width: 38px;
    text-align: center;
  }
</style>
