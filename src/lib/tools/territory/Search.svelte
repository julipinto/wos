<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import { OBJECT_DEFS, type PlacedObject } from './territory';

  // Find an object by name/label, or jump to an "x,y" coordinate. Picking a
  // result selects + centres it on the board (the page wires onPick / onGoto).
  interface Props {
    objects: PlacedObject[];
    nameOf: (t: string) => string;
    onPick: (o: PlacedObject) => void;
    onGoto: (x: number, y: number) => void;
  }
  let { objects, nameOf, onPick, onGoto }: Props = $props();

  let q = $state('');
  let open = $state(false);

  // "12,34" / "12 34" / "(12, 34)" → a coordinate jump (grid is 0..59).
  const coord = $derived.by(() => {
    const m = q.match(/^\s*\(?\s*(\d{1,2})\s*[,\s]\s*(\d{1,2})\s*\)?\s*$/);
    if (!m) return null;
    const x = +m[1];
    const y = +m[2];
    if (x > 59 || y > 59) return null;
    return { x, y };
  });

  const results = $derived.by(() => {
    const s = q.trim().toLowerCase();
    if (!s || coord) return [];
    return objects
      .filter(
        (o) =>
          (o.name && o.name.toLowerCase().includes(s)) ||
          (o.label && o.label.toLowerCase().includes(s))
      )
      .slice(0, 20);
  });

  // Keyboard navigation: a flat list of rows (the coord jump, or the results),
  // an active index, and the DOM nodes to scroll into view.
  const rowCount = $derived(coord ? 1 : results.length);
  let active = $state(0);
  const rowEls: HTMLButtonElement[] = [];
  // Reset the highlight to the top whenever the query changes.
  $effect(() => {
    q.trim(); // track the query so this re-runs on each keystroke
    active = 0;
  });

  function pick(o: PlacedObject) {
    onPick(o);
    q = '';
    open = false;
  }
  function goto() {
    if (!coord) return;
    onGoto(coord.x, coord.y);
    q = '';
    open = false;
  }
  function pickActive() {
    if (coord) goto();
    else if (results[active]) pick(results[active]);
  }
  function move(delta: number) {
    if (rowCount === 0) return;
    open = true;
    active = (active + delta + rowCount) % rowCount;
    rowEls[active]?.scrollIntoView({ block: 'nearest' });
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickActive();
    } else if (e.key === 'Escape') {
      open = false;
      (e.currentTarget as HTMLInputElement).blur();
    }
  }
</script>

<div class="search">
  <span class="search-icon" aria-hidden="true">🔍</span>
  <input
    type="text"
    bind:value={q}
    placeholder={i18n.m.territory.search.placeholder}
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
    onkeydown={onKey}
    aria-label={i18n.m.territory.search.label}
  />
  {#if q}
    <button class="search-clear" type="button" onclick={() => (q = '')} aria-label="clear">×</button
    >
  {/if}
  {#if open && q.trim()}
    <div class="search-drop" role="listbox">
      {#if coord}
        <button
          class="search-row"
          class:active={active === 0}
          type="button"
          role="option"
          aria-selected={active === 0}
          bind:this={rowEls[0]}
          onclick={goto}
        >
          <span class="row-co">→ {coord.x},{coord.y}</span>
          <span class="row-type">{i18n.m.territory.search.goto}</span>
        </button>
      {:else if results.length}
        {#each results as o, i (o.id)}
          {@const def = OBJECT_DEFS[o.type]}
          <button
            class="search-row"
            class:active={active === i}
            type="button"
            role="option"
            aria-selected={active === i}
            bind:this={rowEls[i]}
            onmousemove={() => (active = i)}
            onclick={() => pick(o)}
          >
            <span class="row-dot" style="background:{def.color}"></span>
            <span class="row-name">{o.name || o.label}</span>
            {#if o.name && o.label}<span class="row-label">{o.label}</span>{/if}
            <span class="row-type">{nameOf(o.type)}</span>
            <span class="row-co">{o.x},{o.y}</span>
          </button>
        {/each}
      {:else}
        <p class="search-empty">{i18n.m.territory.search.none}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .search {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 0 12px;
    margin-bottom: 10px;
  }
  .search:focus-within {
    border-color: var(--border-accent);
  }
  .search-icon {
    font-size: 13px;
    opacity: 0.7;
  }
  .search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: 0;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 10px 0;
  }
  .search input:focus-visible {
    outline: none;
  }
  .search-clear {
    background: none;
    border: 0;
    color: var(--text-dim);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
  }
  .search-drop {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 20;
    max-height: 320px;
    overflow-y: auto;
    background: var(--bg-soft);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-card);
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
    padding: 4px;
  }
  .search-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: 0;
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    text-align: start;
    padding: 8px 10px;
    cursor: pointer;
  }
  .search-row:hover,
  .search-row.active {
    background: var(--surface);
  }
  .row-dot {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    flex: none;
  }
  .row-name {
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 9em;
  }
  .row-label {
    color: #fbbf24;
    white-space: nowrap;
  }
  .row-type {
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
  }
  .row-co {
    margin-inline-start: auto;
    color: var(--text-mid);
    white-space: nowrap;
  }
  .search-empty {
    margin: 0;
    padding: 10px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 12px;
  }
</style>
