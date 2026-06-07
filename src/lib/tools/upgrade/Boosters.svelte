<script lang="ts">
  /**
   * Shared, collapsible speed-bonus panel (a "suspended menu"). Inside is an
   * accordion of booster types for the page's category — expand one to enable it
   * and set its value as you unlock it in-game. Edits the global `boosters` store
   * (persisted), so values carry across every calculator, and the summed total is
   * applied live to the page's times.
   */
  import Icon from '$lib/components/Icon.svelte';
  import Select from '$lib/components/Select.svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { formatDuration } from './engine';
  import {
    boosters,
    POSITIONS,
    type BoosterCategory,
    type BoosterDef,
    type BoosterSource
  } from './boosters-store.svelte';

  interface Props {
    categories: BoosterCategory[];
  }
  let { categories }: Props = $props();

  let open = $state(false);
  const expanded = $state<Record<string, boolean>>({});

  const defs = $derived(categories.flatMap((c) => boosters.defsFor(c)));
  const label = (k: string) => (i18n.m.upgrade.boosters as unknown as Record<string, string>)[k];
  const srcLabel = (k: string) => (i18n.m.upgrade.boosters.src as Record<string, string>)[k] ?? k;

  // Group the boosters by source so the same type sits together (hero, pet,
  // alliance…) — easier to find what you actually have. The no-source "enter
  // your total" rows stay at the top, ungrouped.
  const SRC_ORDER: BoosterSource[] = [
    'hero',
    'pet',
    'expert',
    'alliance',
    'island',
    'president',
    'chief'
  ];
  const manualDefs = $derived(defs.filter((d) => !d.source));
  const groups = $derived.by(() => {
    const map = new Map<BoosterSource, BoosterDef[]>();
    for (const d of defs) {
      if (!d.source) continue;
      const list = map.get(d.source) ?? [];
      list.push(d);
      map.set(d.source, list);
    }
    return SRC_ORDER.filter((s) => map.has(s)).map((s) => ({ src: s, defs: map.get(s)! }));
  });

  // Collapsed summary: per-category totals, e.g. "+35% · −2h".
  const summary = $derived(
    categories
      .map((c) => {
        const parts: string[] = [];
        if (boosters.total(c) > 0) parts.push(`+${boosters.total(c)}%`);
        if (boosters.flatTotal(c) > 0) parts.push(`−${formatDuration(boosters.flatTotal(c))}`);
        return parts.join(' ');
      })
      .filter(Boolean)
      .join(' · ')
  );

  // Combined flat reduction across the shown categories (for the total line).
  const flatSum = $derived(categories.reduce((s, c) => s + boosters.flatTotal(c), 0));

  // Dropdown options for a tiered booster. index 0 = off. `unit:'time'` shows a
  // flat reduction ("Lv 1 · −2h"); a `tierUnit` on a % booster shows the level
  // ("VIP 4 · +10%"); otherwise just the percent.
  const tierOptions = (def: BoosterDef) =>
    (def.tiers ?? []).map((v, i) => {
      const named = def.tierLabels?.[i];
      let label: string;
      if (def.unit === 'time') {
        const prefix = named ?? (def.tierUnit ? `${def.tierUnit} ${i}` : '');
        label = i === 0 && !named ? '—' : `${prefix ? `${prefix} · ` : ''}−${formatDuration(v)}`;
      } else if (named) {
        label = `${named}${v > 0 ? ` · +${v}%` : ''}`;
      } else if (def.tierUnit) {
        label = `${def.tierUnit} ${i}${v > 0 ? ` · +${v}%` : ''}`;
      } else {
        label = i === 0 ? '—' : `+${v}%`;
      }
      return { value: String(i), label };
    });

  // The collapsed/active value chip for one booster.
  const valLabel = (def: BoosterDef) => {
    if (!boosters.isActive(def.id)) return '—';
    const c = boosters.contribution(def.id);
    return def.unit === 'time' ? `−${formatDuration(c)}` : `+${c}%`;
  };

  // Single held position (mutually exclusive) — only shown where it applies.
  const showPosition = $derived(boosters.positionAffects(categories));
  const positionOptions = [
    { value: '', label: i18n.m.upgrade.boosters.none },
    ...POSITIONS.map((p) => ({ value: p.id, label: label(p.i18n) }))
  ];
</script>

<div class="boosters" class:open>
  <button class="head" type="button" aria-expanded={open} onclick={() => (open = !open)}>
    <span class="bolt" aria-hidden="true">⚡</span>
    <span class="title">{i18n.m.upgrade.boosters.title}</span>
    {#if !open && summary}<span class="summary">{summary}</span>{/if}
    <Icon name="chevron-down" size={14} class="caret {open ? 'up' : ''}" />
  </button>

  {#if open}
    <div class="body">
      <p class="hint">{i18n.m.upgrade.boosters.hint}</p>

      {#snippet boosterItem(def: BoosterDef)}
        {@const on = boosters.isActive(def.id)}
        <div class="item" class:on>
          <button
            class="item-head"
            type="button"
            aria-expanded={!!expanded[def.id]}
            onclick={() => (expanded[def.id] = !expanded[def.id])}
          >
            <span class="dot" class:lit={on} aria-hidden="true"></span>
            <span class="item-name">{label(def.i18n)}</span>
            <span class="item-val">{valLabel(def)}</span>
            <Icon name="chevron-down" size={12} class="caret {expanded[def.id] ? 'up' : ''}" />
          </button>
          {#if expanded[def.id]}
            <div class="item-body">
              {#if def.tiers}
                <span class="field-label">{i18n.m.upgrade.boosters.level}</span>
                <Select
                  value={String(boosters.value(def.id))}
                  options={tierOptions(def)}
                  onChange={(v) => boosters.set(def.id, Number(v))}
                  ariaLabel={label(def.i18n)}
                />
              {:else}
                <input
                  type="number"
                  min="0"
                  inputmode="numeric"
                  value={boosters.value(def.id)}
                  oninput={(e) => boosters.set(def.id, Number(e.currentTarget.value))}
                  aria-label={label(def.i18n)}
                />
                <span class="sign">%</span>
              {/if}
            </div>
          {/if}
        </div>
      {/snippet}

      <div class="acc">
        {#each manualDefs as def (def.id)}
          {@render boosterItem(def)}
        {/each}
        {#each groups as g (g.src)}
          <div class="group-label">{srcLabel(g.src)}</div>
          {#each g.defs as def (def.id)}
            {@render boosterItem(def)}
          {/each}
        {/each}
      </div>

      {#if showPosition}
        <div class="position">
          <span class="field-label">{i18n.m.upgrade.boosters.position}</span>
          <Select
            value={boosters.position}
            options={positionOptions}
            onChange={(v) => boosters.setPosition(v)}
            ariaLabel={i18n.m.upgrade.boosters.position}
          />
        </div>
      {/if}

      <div class="total">
        <span class="field-label">{i18n.m.upgrade.boosters.total}</span>
        <span class="total-val">
          +{categories.reduce((s, c) => s + boosters.total(c), 0)}%{#if flatSum > 0}
            <span class="total-flat">· −{formatDuration(flatSum)}</span>{/if}
        </span>
      </div>
    </div>
  {/if}
</div>

<style>
  .boosters {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    margin: 16px 0 22px;
    /* No overflow:hidden — it would clip the Select dropdowns inside. */
  }
  .boosters.open {
    border-color: var(--border-accent);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: transparent;
    border: 0;
    color: var(--text);
    padding: 14px 16px;
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .bolt {
    font-size: 14px;
  }
  .title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .summary {
    font-size: 12px;
    color: var(--accent);
    margin-inline-start: auto;
  }
  .head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
    margin-inline-start: auto;
  }
  .summary + :global(.caret) {
    margin-inline-start: 8px;
  }
  .head :global(.caret.up),
  .item-head :global(.caret.up) {
    transform: rotate(180deg);
  }
  .body {
    padding: 4px 16px 16px;
    display: grid;
    gap: 12px;
  }
  .hint {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
    margin: 0;
  }

  .acc {
    display: grid;
    gap: 8px;
  }
  .group-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin: 6px 0 -2px 2px;
  }
  .item {
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  .item.on {
    border-color: var(--border-accent);
  }
  .item-head {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: var(--bg-soft);
    border: 0;
    border-radius: 11px;
    color: var(--text);
    padding: 12px 14px;
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--border-strong);
  }
  .dot.lit {
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent-glow-strong);
  }
  .item-name {
    font-size: 13px;
    flex: 1;
    text-align: start;
  }
  .item-val {
    font-size: 12px;
    color: var(--text-mid);
  }
  .item-head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
  }
  .item-body {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  input {
    width: 110px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 15px;
    padding: 8px 12px;
    text-align: end;
  }
  input:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .sign {
    font-family: var(--font-mono);
    color: var(--text-dim);
    font-size: 14px;
  }
  .position {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 4px;
    border-top: 1px solid var(--border);
  }
  .total-val {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 18px;
    color: var(--accent);
  }
  .total-flat {
    font-size: 13px;
    color: var(--text-mid);
  }
</style>
