<script lang="ts">
  import { OBJECT_DEFS } from './territory';

  // Collapsible legend explaining the board encoding: object-type swatches plus
  // the connectivity/selection/bear-focus overlay colours mirrored from Board.svelte.
  // i18n strings are passed in (no i18n import) so the parent owns translation.
  interface Props {
    types: string[];
    nameOf: (t: string) => string;
    connectivity: boolean;
    labels: {
      title: string;
      connected: string;
      coverage: string;
      orphaned: string;
      selected: string;
      bearFocus: string;
    };
  }
  let { types, nameOf, connectivity, labels }: Props = $props();
</script>

<details class="legend">
  <summary>{labels.title}</summary>
  <div class="rows">
    {#each types as t (t)}
      <div class="row">
        <span class="swatch" style="background: {OBJECT_DEFS[t].color}"></span>
        <span class="txt">{nameOf(t)}</span>
      </div>
    {/each}
    {#if connectivity}
      <div class="row">
        <span class="swatch" style="background: rgba(147, 212, 255, 0.5)"></span>
        <span class="txt">{labels.connected}</span>
      </div>
      <div class="row">
        <span class="swatch" style="background: rgba(251, 191, 36, 0.45)"></span>
        <span class="txt">{labels.coverage}</span>
      </div>
      <div class="row">
        <span class="swatch" style="background: transparent; border: 2px solid #fb7185"></span>
        <span class="txt">{labels.orphaned}</span>
      </div>
    {/if}
    <div class="row">
      <span class="swatch" style="background: transparent; border: 2px solid #fff"></span>
      <span class="txt">{labels.selected}</span>
    </div>
    <div class="row">
      <span class="swatch" style="background: #fbbf24"></span>
      <span class="txt">{labels.bearFocus}</span>
    </div>
  </div>
</details>

<style>
  .legend {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    font-family: var(--font-mono);
  }
  summary {
    cursor: pointer;
    padding: 8px 12px;
    color: var(--text-mid);
    font-size: 11px;
    list-style-position: inside;
  }
  .rows {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 6px 12px;
    padding: 4px 12px 10px;
  }
  .row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .swatch {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    box-sizing: border-box;
  }
  .txt {
    color: var(--text-dim);
    font-size: 11px;
  }
</style>
