<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import Select from '$lib/components/Select.svelte';
  import Palette from './Palette.svelte';
  import Legend from './Legend.svelte';

  // The left rail: a vertical, labelled toolbar that gathers every board control
  // into scannable sections — Tools (edit/view, projection), Place (the object
  // palette), and Display (labels / heatmap / bear focus + the legend). Keeps the
  // canvas uncluttered (the page top-bar keeps only zoom + history).
  interface Props {
    boardMode: 'edit' | 'view';
    onBoardMode: (b: 'edit' | 'view') => void;
    view: 'flat' | 'iso';
    onView: (v: 'flat' | 'iso') => void;
    // palette
    types: string[];
    tool: string;
    nameOf: (key: string) => string;
    count: (type: string) => number;
    onPick: (type: string) => void;
    // display
    showLabels: boolean;
    labelField: 'furnace' | 'name';
    onLabelField: (f: 'furnace' | 'name') => void;
    heatmap: boolean;
    colorByPrimary: boolean;
    highlight: string;
    highlightOptions: { value: string; label: string }[];
    bearFocus: number;
    hasBears: boolean;
    bearCount: number;
    bearStats: { n: number; main: number; backup: number }[];
    connectivity: boolean;
  }
  let {
    boardMode,
    onBoardMode,
    view,
    onView,
    types,
    tool,
    nameOf,
    count,
    onPick,
    showLabels = $bindable(),
    labelField,
    onLabelField,
    heatmap = $bindable(),
    colorByPrimary = $bindable(),
    highlight = $bindable(),
    highlightOptions,
    bearFocus = $bindable(),
    hasBears,
    bearCount,
    bearStats,
    connectivity
  }: Props = $props();

  let open = $state(false); // mobile: rail collapsed by default (desktop ignores)

  const legendLabels = $derived({
    title: i18n.m.territory.legend.title,
    connected: i18n.m.territory.legend.connected,
    coverage: i18n.m.territory.legend.reach,
    orphaned: i18n.m.territory.legend.orphan,
    selected: i18n.m.territory.legend.selected,
    bearFocus: i18n.m.territory.bearFocus
  });
</script>

<div class="rail">
  <button class="rail-toggle" type="button" aria-expanded={open} onclick={() => (open = !open)}>
    <span>⚙ {i18n.m.territory.rail.tools}</span>
    <span class="caret" class:up={open}>▾</span>
  </button>
  <div class="rail-body" class:open>
    <section class="rail-sec">
      <span class="rail-h">{i18n.m.territory.rail.tools}</span>
      <Segmented
        value={boardMode}
        ariaLabel={i18n.m.territory.boardMode.label}
        options={[
          { value: 'edit', label: `✏️ ${i18n.m.territory.boardMode.edit}` },
          { value: 'view', label: `🖐 ${i18n.m.territory.boardMode.view}` }
        ]}
        onChange={(v) => onBoardMode(v as 'edit' | 'view')}
      />
      <Segmented
        value={view}
        ariaLabel={i18n.m.territory.view.label}
        options={[
          { value: 'flat', label: i18n.m.territory.view.flat },
          { value: 'iso', label: i18n.m.territory.view.tilt }
        ]}
        onChange={(v) => onView(v as 'flat' | 'iso')}
      />
    </section>

    {#if boardMode === 'edit'}
      <section class="rail-sec">
        <span class="rail-h">{i18n.m.territory.place}</span>
        <Palette
          {types}
          {tool}
          {nameOf}
          {count}
          {onPick}
          ariaLabel={i18n.m.territory.place}
          vertical
        />
      </section>
    {/if}

    <section class="rail-sec">
      <span class="rail-h">{i18n.m.territory.rail.display}</span>
      <div class="rail-toggles">
        <button
          class="toggle"
          class:on={showLabels}
          type="button"
          onclick={() => (showLabels = !showLabels)}
        >
          {i18n.m.territory.labels}
        </button>
        <button
          class="toggle"
          class:on={heatmap}
          type="button"
          onclick={() => (heatmap = !heatmap)}
        >
          {i18n.m.territory.heatmap}
        </button>
        {#if hasBears && bearCount > 0}
          <button
            class="toggle"
            class:on={colorByPrimary}
            type="button"
            onclick={() => (colorByPrimary = !colorByPrimary)}
          >
            {i18n.m.territory.colorByPrimary}
          </button>
        {/if}
      </div>
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
      <div class="hi-row">
        <span class="bf-label">{i18n.m.territory.highlight}</span>
        <Select
          value={highlight}
          options={highlightOptions}
          onChange={(v) => (highlight = v)}
          ariaLabel={i18n.m.territory.highlight}
        />
      </div>
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
          <ul class="bear-tally">
            {#each bearStats as s (s.n)}
              <li>
                <span class="bt-trap">🐻 {s.n}</span>
                <span class="bt-main">{s.main} {i18n.m.territory.bearMainShort}</span>
                <span class="bt-backup">{s.backup} {i18n.m.territory.bearBackupShort}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>

    <section class="rail-sec">
      <Legend {types} {nameOf} {connectivity} labels={legendLabels} />
    </section>
  </div>
</div>

<style>
  .rail-body {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  /* The collapse toggle is desktop-hidden; on phones the rail would otherwise be
     a tall stack that pushes the board off-screen, so it collapses behind this. */
  .rail-toggle {
    display: none;
  }
  .rail-sec {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rail-h {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .rail-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
  .bear-focus,
  .hi-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .bear-tally {
    list-style: none;
    margin: 2px 0 0;
    padding: 0;
    display: grid;
    gap: 3px;
  }
  .bear-tally li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 10px;
  }
  .bt-trap {
    color: var(--text-mid);
  }
  .bt-main {
    color: #fbbf24;
  }
  .bt-backup {
    color: var(--text-dim);
    margin-inline-start: auto;
  }
  .bf-label {
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
  }
  /* Phones: collapse the rail behind a toggle so the board is reachable without
     scrolling past every control. Desktop keeps it always-open (no toggle). */
  @media (max-width: 1023px) {
    .rail-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-pill);
      color: var(--text-mid);
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 10px 16px;
      cursor: pointer;
    }
    .rail-toggle .caret {
      transition: transform 0.2s ease;
    }
    .rail-toggle .caret.up {
      transform: rotate(180deg);
    }
    .rail-body {
      display: none;
    }
    .rail-body.open {
      display: flex;
      margin-top: 12px;
    }
  }
</style>
