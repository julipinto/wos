<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Button from '$lib/components/Button.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Select from '$lib/components/Select.svelte';
  import CompareBoard from '$lib/tools/territory/CompareBoard.svelte';
  import {
    importLayout,
    OBJECT_DEFS,
    MODES,
    type PlacedObject
  } from '$lib/tools/territory/territory';
  import { savedMaps } from '$lib/tools/territory/maps.svelte';
  import { diffLayouts, type ChangeKind, type FieldKey } from '$lib/tools/territory/compare';

  const objName = (k: string) => (i18n.m.territory.obj as Record<string, string>)[k];
  // $derived so the page re-localises live when the language switches.
  const x = $derived(i18n.m.territory.compare);

  // One editable side (before / after). Text → parsed objects (or an error).
  let beforeText = $state('');
  let afterText = $state('');
  let beforeObjs = $state<PlacedObject[] | null>(null);
  let afterObjs = $state<PlacedObject[] | null>(null);
  let beforeErr = $state(false);
  let afterErr = $state(false);

  // Seeded from the planner ("compare this saved map with the current board"):
  // before = the saved map, after = the live layout. One-shot, then cleared.
  onMount(() => {
    // Re-read saved maps now that we're on the client (the module's init-time
    // read may have run during prerender, before localStorage existed).
    savedMaps.reload();
    const raw = sessionStorage.getItem('territory-compare-seed');
    if (!raw) return;
    sessionStorage.removeItem('territory-compare-seed');
    try {
      const seed = JSON.parse(raw);
      if (Array.isArray(seed.before)) beforeObjs = seed.before as PlacedObject[];
      if (Array.isArray(seed.after)) afterObjs = seed.after as PlacedObject[];
    } catch {
      /* malformed seed — ignore, start blank */
    }
  });

  async function load(side: 'before' | 'after') {
    const text = side === 'before' ? beforeText : afterText;
    const res = text.trim() ? await importLayout(text.trim()) : null;
    if (side === 'before') {
      beforeObjs = res?.objects ?? null;
      beforeErr = !res && !!text.trim();
    } else {
      afterObjs = res?.objects ?? null;
      afterErr = !res && !!text.trim();
    }
  }
  async function onFile(side: 'before' | 'after', e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = (await file.text()).trim();
    if (side === 'before') beforeText = text;
    else afterText = text;
    await load(side);
    input.value = '';
  }
  function clearSide(side: 'before' | 'after') {
    if (side === 'before') {
      beforeText = '';
      beforeObjs = null;
      beforeErr = false;
    } else {
      afterText = '';
      afterObjs = null;
      afterErr = false;
    }
  }
  function swap() {
    [beforeText, afterText] = [afterText, beforeText];
    [beforeObjs, afterObjs] = [afterObjs, beforeObjs];
    [beforeErr, afterErr] = [afterErr, beforeErr];
  }

  // Saved maps across every mode → "<mode>|<id>" option values for the picker.
  const mapOptions = $derived.by(() => {
    const opts: { value: string; label: string }[] = [{ value: '', label: x.pickMap }];
    for (const m of MODES) {
      for (const map of savedMaps.all(m.id)) {
        const prefix = MODES.length > 1 ? `${m.id} · ` : '';
        opts.push({
          value: `${m.id}|${map.id}`,
          label: `${prefix}${map.name} (${map.objects.length})`
        });
      }
    }
    return opts;
  });
  const hasMaps = $derived(mapOptions.length > 1);

  function pickMap(side: 'before' | 'after', value: string) {
    if (!value) return;
    const [mode, id] = value.split('|');
    const objs = savedMaps.objectsOf(mode, id);
    if (side === 'before') {
      beforeObjs = objs;
      beforeText = '';
      beforeErr = false;
    } else {
      afterObjs = objs;
      afterText = '';
      afterErr = false;
    }
  }

  const diff = $derived(beforeObjs && afterObjs ? diffLayouts(beforeObjs, afterObjs) : null);
  const hasChanges = $derived(
    !!diff && diff.counts.added + diff.counts.removed + diff.counts.moved + diff.counts.changed > 0
  );

  const KINDS: ChangeKind[] = ['added', 'removed', 'moved', 'changed'];
  const KIND_COLOR: Record<ChangeKind, string> = {
    added: '#4ade80',
    removed: '#fb7185',
    moved: '#fbbf24',
    changed: '#60a5fa',
    unchanged: '#64748b'
  };

  // Change list, only the interesting kinds, grouped in a stable order.
  const entries = $derived.by(() => {
    if (!diff) return [];
    const rank = (k: ChangeKind) => KINDS.indexOf(k);
    return diff.pieces
      .filter((p) => p.kind !== 'unchanged')
      .sort((a, b) => rank(a.kind) - rank(b.kind) || a.label.localeCompare(b.label));
  });

  const fieldName = (f: FieldKey) => (x.fields as Record<string, string>)[f] ?? f;
  // 'type' field carries raw type keys — localise them for display.
  const fieldVal = (f: FieldKey, v: string) =>
    f === 'type' && OBJECT_DEFS[v] ? objName(OBJECT_DEFS[v].i18n) : v;
  const labelFor = (p: { label: string; o: PlacedObject }) =>
    p.label || `${objName(OBJECT_DEFS[p.o.type].i18n)} ${p.o.x},${p.o.y}`;
</script>

<div class="wrap">
  <PageHeader title={x.title} sub={x.sub} backHref="/territory" />

  <div class="inputs">
    {#each [{ side: 'before', text: beforeText, objs: beforeObjs, err: beforeErr }, { side: 'after', text: afterText, objs: afterObjs, err: afterErr }] as col (col.side)}
      <div class="in-card">
        <div class="in-head">
          <span class="in-title">{col.side === 'before' ? x.before : x.after}</span>
          {#if col.objs}
            <span class="in-count">{col.objs.length} {x.pieces}</span>
          {/if}
        </div>
        {#if hasMaps}
          <Select
            value=""
            options={mapOptions}
            onChange={(v) => pickMap(col.side as 'before' | 'after', v)}
            ariaLabel={x.pickMap}
          />
          <span class="in-or">{x.or}</span>
        {/if}
        {#if col.side === 'before'}
          <textarea
            bind:value={beforeText}
            placeholder={x.paste}
            rows="3"
            spellcheck="false"
            aria-label={x.before}
          ></textarea>
        {:else}
          <textarea
            bind:value={afterText}
            placeholder={x.paste}
            rows="3"
            spellcheck="false"
            aria-label={x.after}
          ></textarea>
        {/if}
        {#if col.err}<p class="in-err">⚠️ {x.invalid}</p>{/if}
        <div class="in-actions">
          <Button
            variant="primary"
            size="sm"
            onclick={() => load(col.side as 'before' | 'after')}
            disabled={!col.text.trim()}
          >
            {x.import}
          </Button>
          <label class="file-btn">
            <Icon name="upload" size={13} />
            {x.fromFile}
            <input
              type="file"
              accept=".txt,text/plain"
              onchange={(e) => onFile(col.side as 'before' | 'after', e)}
            />
          </label>
          {#if col.objs || col.text}
            <Button
              variant="ghost"
              size="sm"
              onclick={() => clearSide(col.side as 'before' | 'after')}
            >
              {x.clear}
            </Button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="swap-row">
    <Button variant="secondary" size="sm" onclick={swap}>⇄ {x.swap}</Button>
    <a class="planner-link" href="{base}/territory">{x.openPlanner}</a>
  </div>

  {#if diff}
    <div class="summary">
      {#each KINDS as k (k)}
        <span class="chip" style="--c: {KIND_COLOR[k]}">
          <span class="dot"></span>{diff.counts[k]}
          {x[k]}
        </span>
      {/each}
      <span class="chip muted">{diff.counts.unchanged} {x.unchanged}</span>
    </div>

    {#if hasChanges}
      <div class="result">
        <div class="board-wrap">
          <CompareBoard {diff} {objName} />
        </div>
        <div class="changes">
          <span class="changes-h">{x.changes}</span>
          <ul>
            {#each entries as p (p.o.id + '_' + p.kind)}
              <li class="change" style="--c: {KIND_COLOR[p.kind]}">
                <div class="ch-head">
                  <span class="ch-mark"
                    >{p.kind === 'added' ? '+' : p.kind === 'removed' ? '−' : '~'}</span
                  >
                  <span class="ch-name">{labelFor(p)}</span>
                  <span class="ch-kind">{x[p.kind]}</span>
                </div>
                {#if p.changes.length}
                  <ul class="ch-fields">
                    {#each p.changes as c (c.field)}
                      <li>
                        <span class="cf-name">{fieldName(c.field)}</span>
                        <span class="cf-before">{fieldVal(c.field, c.before)}</span>
                        <span class="cf-arrow">→</span>
                        <span class="cf-after">{fieldVal(c.field, c.after)}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      </div>
    {:else}
      <p class="empty">✓ {x.identical}</p>
    {/if}
  {:else}
    <p class="empty">{x.bothNeeded}</p>
  {/if}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .inputs {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 640px) {
    .inputs {
      grid-template-columns: 1fr 1fr;
    }
  }
  .in-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 14px;
  }
  .in-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .in-title {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .in-count {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent);
  }
  .in-or {
    align-self: center;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 10px;
    resize: vertical;
  }
  textarea:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .in-err {
    margin: 0;
    color: #fbbf24;
    font-family: var(--font-mono);
    font-size: 11px;
  }
  .in-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .file-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 8px 14px;
    cursor: pointer;
  }
  .file-btn:hover {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .file-btn input[type='file'] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .swap-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 14px 0;
  }
  .planner-link {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
    text-decoration: none;
    border-bottom: 1px dashed var(--border-accent);
  }
  .planner-link:hover {
    color: var(--text);
  }
  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 5px 11px;
  }
  .chip .dot {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    background: var(--c);
  }
  .chip.muted {
    color: var(--text-dim);
  }
  .result {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    align-items: start;
  }
  @media (min-width: 820px) {
    .result {
      grid-template-columns: 1.3fr 1fr;
    }
  }
  .board-wrap {
    position: sticky;
    top: 16px;
  }
  .changes {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .changes-h {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .changes > ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .change {
    border-inline-start: 3px solid var(--c);
    background: var(--surface);
    border-radius: 0 var(--r-card) var(--r-card) 0;
    padding: 8px 12px;
  }
  .ch-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ch-mark {
    color: var(--c);
    font-family: var(--font-mono);
    font-weight: 700;
    width: 0.9em;
    text-align: center;
  }
  .ch-name {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text);
    font-weight: 600;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ch-kind {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--c);
  }
  .ch-fields {
    list-style: none;
    margin: 6px 0 0;
    padding: 0 0 0 calc(0.9em + 8px);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .ch-fields li {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
  }
  .cf-name {
    color: var(--text-dim);
    min-width: 56px;
  }
  .cf-after {
    color: var(--text);
  }
  .cf-arrow {
    color: var(--text-dim);
  }
  .empty {
    text-align: center;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-mid);
    padding: 40px 0;
  }
</style>
