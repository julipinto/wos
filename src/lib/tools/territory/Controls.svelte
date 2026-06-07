<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Segmented from '$lib/components/Segmented.svelte';

  // Board controls: zoom, label toggle + field, heatmap, and bear-trap focus.
  interface Props {
    zoom: number;
    showLabels: boolean;
    heatmap: boolean;
    bearFocus: number;
    labelField: 'furnace' | 'name';
    onLabelField: (f: 'furnace' | 'name') => void;
    hasBears: boolean;
    bearCount: number;
  }
  let {
    zoom = $bindable(),
    showLabels = $bindable(),
    heatmap = $bindable(),
    bearFocus = $bindable(),
    labelField,
    onLabelField,
    hasBears,
    bearCount
  }: Props = $props();
</script>

<div class="controls">
  <div class="zoom">
    <button
      class="ctl"
      type="button"
      onclick={() => (zoom = Math.max(1, +(zoom - 0.5).toFixed(1)))}
      disabled={zoom <= 1}
      aria-label="zoom out">−</button
    >
    <span class="zoom-val">{Math.round(zoom * 100)}%</span>
    <button
      class="ctl"
      type="button"
      onclick={() => (zoom = Math.min(3, +(zoom + 0.5).toFixed(1)))}
      disabled={zoom >= 3}
      aria-label="zoom in">+</button
    >
  </div>
  <button
    class="toggle"
    class:on={showLabels}
    type="button"
    onclick={() => (showLabels = !showLabels)}
  >
    {i18n.m.territory.labels}
  </button>
  {#if showLabels}
    <Segmented
      value={labelField}
      options={[
        { value: 'furnace', label: i18n.m.territory.labelFurnace },
        { value: 'name', label: i18n.m.territory.labelName }
      ]}
      onChange={(v) => onLabelField(v as 'furnace' | 'name')}
    />
  {/if}
  <button class="toggle" class:on={heatmap} type="button" onclick={() => (heatmap = !heatmap)}>
    {i18n.m.territory.heatmap}
  </button>
  {#if hasBears && bearCount > 0}
    <div class="bear-focus">
      <span class="bf-label">🐻 {i18n.m.territory.bearFocus}</span>
      <Segmented
        value={String(bearFocus)}
        ariaLabel={i18n.m.territory.bearFocus}
        options={[
          { value: '0', label: i18n.m.territory.bearAll },
          ...Array.from({ length: bearCount }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1)
          }))
        ]}
        onChange={(v) => (bearFocus = Number(v))}
      />
    </div>
  {/if}
</div>

<style>
  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
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
  .toggle {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 6px 12px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .toggle.on {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  .bear-focus {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .bf-label {
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
  }
</style>
