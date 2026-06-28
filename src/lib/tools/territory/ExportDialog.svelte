<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import { OBJECT_DEFS, type PlacedObject } from './territory';
  import { renderHive, toPng, type ImageOpts } from './export-image';
  import { toDrawio } from './export-drawio';

  interface Props {
    open: boolean;
    onClose: () => void;
    objects: PlacedObject[];
    connectivity: boolean;
    defaultTitle: string;
    /** resolve an OBJECT_DEFS i18n key → localised name (for legend/table). */
    objName: (i18nKey: string) => string;
  }
  let { open, onClose, objects, connectivity, defaultTitle, objName }: Props = $props();

  // Image options.
  let labels = $state(true);
  let ids = $state(false); // city user IDs — off by default (opt-in)
  let coverage = $state(true);
  let grid = $state(true);
  let legend = $state(true);
  let table = $state(true);
  let colorByPrimary = $state(true);
  let title = $state(''); // empty → falls back to defaultTitle (shown as placeholder)
  let background = $state<'dark' | 'light'>('dark');
  let crop = $state<'hive' | 'grid'>('hive');
  let view = $state<'flat' | 'iso'>('flat');
  let quality = $state<'sm' | 'md' | 'lg'>('md');
  const QUALITY_PX = { sm: 30, md: 45, lg: 64 };

  let copied = $state(false);
  let busy = $state(false);
  let preview = $state<HTMLCanvasElement>();

  const typeName = (key: string) => objName(key);
  function opts(cellPx: number): ImageOpts {
    return {
      labels,
      ids,
      coverage,
      grid,
      legend,
      table,
      colorByPrimary,
      title: title.trim() || defaultTitle,
      background,
      crop,
      view,
      cellPx,
      connectivity,
      typeName
    };
  }

  // Live preview — re-renders at a small cell size whenever an option changes.
  $effect(() => {
    if (open && preview) renderHive(preview, objects, opts(14));
  });

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPng() {
    busy = true;
    try {
      download(await toPng(objects, opts(QUALITY_PX[quality])), 'hive.png');
    } finally {
      busy = false;
    }
  }
  async function copyPng() {
    try {
      const blob = await toPng(objects, opts(QUALITY_PX[quality]));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      /* clipboard image unsupported — user can download instead */
    }
  }
  function downloadDrawio() {
    download(new Blob([toDrawio(objects)], { type: 'application/xml' }), 'hive.drawio');
  }
  async function downloadXlsx() {
    busy = true;
    try {
      const { toXlsx } = await import('./export-xlsx');
      const blob = await toXlsx(objects, (t) => objName(OBJECT_DEFS[t].i18n));
      download(blob, 'hive.xlsx');
    } finally {
      busy = false;
    }
  }

  const x = i18n.m.territory.export;
</script>

<Modal {open} {onClose} xwide label={x.title}>
  <div class="ex">
    <span class="ex-h">{x.title}</span>

    <div class="ex-grid">
      <div class="ex-opts">
        <span class="ex-sec">🖼️ {x.image}</span>
        <TextInput bind:value={title} placeholder={defaultTitle} />
        <div class="ex-toggles">
          <button class="tg" class:on={labels} type="button" onclick={() => (labels = !labels)}
            >{x.optLabels}</button
          >
          <button class="tg" class:on={ids} type="button" onclick={() => (ids = !ids)}
            >{x.optIds}</button
          >
          <button
            class="tg"
            class:on={colorByPrimary}
            type="button"
            onclick={() => (colorByPrimary = !colorByPrimary)}>{x.optPrimary}</button
          >
          {#if connectivity}
            <button
              class="tg"
              class:on={coverage}
              type="button"
              onclick={() => (coverage = !coverage)}>{x.optCoverage}</button
            >
          {/if}
          <button class="tg" class:on={grid} type="button" onclick={() => (grid = !grid)}
            >{x.optGrid}</button
          >
          <button class="tg" class:on={legend} type="button" onclick={() => (legend = !legend)}
            >{x.optLegend}</button
          >
          <button class="tg" class:on={table} type="button" onclick={() => (table = !table)}
            >{x.optTable}</button
          >
        </div>
        <Segmented
          value={background}
          ariaLabel={x.bg}
          options={[
            { value: 'dark', label: x.dark },
            { value: 'light', label: x.light }
          ]}
          onChange={(v) => (background = v as 'dark' | 'light')}
        />
        <Segmented
          value={crop}
          ariaLabel={x.crop}
          options={[
            { value: 'hive', label: x.cropHive },
            { value: 'grid', label: x.cropGrid }
          ]}
          onChange={(v) => (crop = v as 'hive' | 'grid')}
        />
        <Segmented
          value={view}
          ariaLabel={i18n.m.territory.view.label}
          options={[
            { value: 'flat', label: i18n.m.territory.view.flat },
            { value: 'iso', label: i18n.m.territory.view.tilt }
          ]}
          onChange={(v) => (view = v as 'flat' | 'iso')}
        />
        <Segmented
          value={quality}
          ariaLabel={x.quality}
          options={[
            { value: 'sm', label: 'S' },
            { value: 'md', label: 'M' },
            { value: 'lg', label: 'L' }
          ]}
          onChange={(v) => (quality = v as 'sm' | 'md' | 'lg')}
        />
        <div class="ex-row">
          <Button variant="primary" size="sm" disabled={busy} onclick={downloadPng}>
            ⬇ {x.downloadPng}
          </Button>
          <Button variant="secondary" size="sm" onclick={copyPng}>
            {copied ? '✓ ' + x.copied : '⧉ ' + x.copy}
          </Button>
        </div>
      </div>

      <div class="ex-preview">
        <canvas bind:this={preview}></canvas>
      </div>
    </div>

    <div class="ex-more">
      <Button variant="secondary" size="sm" onclick={downloadDrawio}>✏️ {x.drawio}</Button>
      <Button variant="secondary" size="sm" disabled={busy} onclick={downloadXlsx}
        >📊 {x.excel}</Button
      >
    </div>
  </div>
</Modal>

<style>
  .ex {
    display: flex;
    flex-direction: column;
    gap: 14px;
    /* Fit inside the xwide Modal's content box (680px − 2×28px padding). */
    min-width: min(82vw, 600px);
  }
  .ex-h {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .ex-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 560px) {
    .ex-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  .ex-opts {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ex-sec {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .ex-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tg {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 6px 11px;
    cursor: pointer;
  }
  .tg.on {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  .ex-row,
  .ex-more {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ex-more {
    border-top: 1px solid var(--border);
    padding-top: 12px;
  }
  .ex-preview {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 8px;
    overflow: auto;
    max-height: 320px;
  }
  .ex-preview canvas {
    max-width: 100%;
    height: auto;
  }
</style>
