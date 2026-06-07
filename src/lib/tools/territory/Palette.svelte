<script lang="ts">
  import { OBJECT_DEFS } from './territory';

  // Object picker for the active planner mode.
  interface Props {
    types: string[];
    tool: string;
    ariaLabel: string;
    nameOf: (i18nKey: string) => string;
    count: (type: string) => number;
    onPick: (type: string) => void;
  }
  let { types, tool, ariaLabel, nameOf, count, onPick }: Props = $props();
</script>

<div class="palette" role="toolbar" aria-label={ariaLabel}>
  {#each types as t (t)}
    {@const def = OBJECT_DEFS[t]}
    <button
      class="tool"
      class:active={tool === t}
      type="button"
      onclick={() => onPick(t)}
      style="--c: {def.color}"
    >
      <span class="swatch" style="background: {def.color}"></span>
      <span class="tool-name">{nameOf(def.i18n)}</span>
      <span class="tool-count">{count(t)}{def.max ? `/${def.max}` : ''}</span>
    </button>
  {/each}
</div>

<style>
  .palette {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }
  .tool {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      color 0.2s ease;
  }
  .tool.active {
    border-color: var(--c);
    color: var(--text);
  }
  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .tool-count {
    color: var(--text-dim);
    font-size: 11px;
  }
</style>
