<script lang="ts">
  import { base } from '$app/paths';
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Boosters from '$lib/tools/upgrade/Boosters.svelte';
  import DeficitPanel from '$lib/tools/upgrade/DeficitPanel.svelte';
  import { speedups } from '$lib/tools/upgrade/speedups.svelte';
  import {
    addBags,
    applySpeed,
    formatQty,
    formatDuration,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { RESOURCES, type ResourceBag } from '$lib/tools/upgrade/types';
  import { boosters, type BoosterCategory } from '$lib/tools/upgrade/boosters-store.svelte';
  import { planLines, cutBase, PLAN_STORAGE_KEYS } from '$lib/tools/upgrade/plan';
  import { estimate, planById, PRESETS } from '$lib/tools/upgrade/refinement';
  import Segmented from '$lib/components/Segmented.svelte';

  // Snapshot of saved selections (read once on load).
  const lines = planLines();

  let speedOpen = $state(false);
  let copied = $state(false);

  // Build a plain-text summary (paste into alliance chat) and copy it.
  async function copyPlan() {
    const out: string[] = ['WOS — ' + i18n.m.upgrade.title, ''];
    out.push(i18n.m.upgrade.totalEyebrow.toUpperCase());
    for (const k of grandRows)
      out.push(`  ${resDef(k).icon} ${resName(k)}: ${formatQty(grand[k] ?? 0)}`);
    if (refineRfc > 0)
      out.push(
        `  🔥 ${i18n.m.upgrade.plan.toRefine}: ~${formatQty(refineFc)} FC (${refineModeName})`
      );
    if (timeRows.length > 0) {
      out.push('');
      for (const t of timeRows)
        out.push(`  ${timeLabel(t.cat)}: ${formatDuration(speedups.any ? t.left : t.secs)}`);
    }
    out.push('', i18n.m.upgrade.plan.includes.toUpperCase());
    for (const l of activeLines) out.push(`  ${catName(l.id)}: ${l.detail.join(', ')}`);
    try {
      await navigator.clipboard.writeText(out.join('\n'));
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      copied = false;
    }
  }

  function clearPlan() {
    if (!confirm(i18n.m.upgrade.plan.clearConfirm)) return;
    for (const k of PLAN_STORAGE_KEYS) localStorage.removeItem(k);
    location.reload();
  }

  const zimanPct = $derived(boosters.contribution('zinman'));
  // Apply Zinman's construction base-resource cut to the buildings line.
  const adjLines = $derived(
    lines.map((l) =>
      l.id === 'buildings' && zimanPct > 0 ? { ...l, totals: cutBase(l.totals, zimanPct) } : l
    )
  );

  // Toggle which plan lines count toward the totals — lets you vary "what if I
  // do this upgrade or not" without leaving the page.
  let enabled = $state(new Set(lines.map((l) => l.id)));
  function toggleLine(id: string) {
    const next = new Set(enabled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    enabled = next;
  }
  const activeLines = $derived(adjLines.filter((l) => enabled.has(l.id)));

  const grand = $derived(activeLines.reduce<ResourceBag>((acc, l) => addBags(acc, l.totals), {}));
  const grandRows = $derived(presentResources(grand));

  // Refinement: how many FC to refine the plan's Refined Fire Crystals, at a
  // chosen intensity. Approximate (RNG) — shown low-key, mode included.
  const refineRfc = $derived(grand.refinedFireCrystal ?? 0);
  let refineMode = $state('economic');
  const refinePlan = $derived(planById(PRESETS.find((p) => p.key === refineMode)?.plan ?? 'L3'));
  const refineEst = $derived(estimate(refineRfc, refinePlan));
  const refineFc = $derived(refineEst.fcTotal);
  const refineModeName = $derived(
    (i18n.m.upgrade.refinement as Record<string, string>)[refineMode]
  );
  // Refining runs on its own weekly clock — shown as its own meta, NOT summed
  // into build/research/training time.
  const refineWeeks = $derived(
    refineEst.weeks >= 8
      ? fmt(i18n.m.upgrade.refinement.weeksMonths, {
          n: refineEst.weeks,
          m: Math.round(refineEst.weeks / 4.345)
        })
      : fmt(i18n.m.upgrade.refinement.weeks, { n: refineEst.weeks })
  );

  // Time runs in parallel queues, so report per category — never one summed total.
  const TIME_CATS: BoosterCategory[] = ['construction', 'research', 'training'];
  const catTime = (cat: BoosterCategory) => {
    const summed = activeLines
      .filter((l) => l.timeCategory === cat)
      .reduce((t, l) => t + applySpeed(l.time, boosters.total(cat)), 0);
    // Subtract any flat reduction (Agnes, construction), clamped at 0.
    return Math.max(0, summed - boosters.flatTotal(cat));
  };
  const timeRows = $derived(
    TIME_CATS.map((cat) => ({
      cat,
      secs: catTime(cat),
      left: speedups.remaining(cat, catTime(cat))
    })).filter((t) => t.secs > 0)
  );
  // Expert-skill learning time runs on its own (no speed booster / queue).
  const learningTime = $derived(
    activeLines.filter((l) => l.timeCategory === 'learning').reduce((t, l) => t + l.time, 0)
  );
  const timeLabel = (cat: BoosterCategory) =>
    cat === 'construction'
      ? i18n.m.upgrade.buildTime
      : cat === 'research'
        ? i18n.m.upgrade.researchTime
        : i18n.m.upgrade.trainTime;

  const catName = (k: string) => (i18n.m.upgrade.cat as Record<string, string>)[k];
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.plan} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.upgrade.cat.plan} sub={i18n.m.upgrade.plan.sub} backHref="/upgrade" />

  {#if lines.length === 0}
    <p class="empty">{i18n.m.upgrade.plan.empty}</p>
    <a class="cta" href="{base}/upgrade">{i18n.m.common.back}</a>
  {:else}
    <Boosters categories={['construction', 'research', 'training']} />

    <div class="actions">
      <button class="act" type="button" onclick={copyPlan}>
        <Icon name={copied ? 'check' : 'copy'} size={13} />
        {copied ? i18n.m.upgrade.plan.copied : i18n.m.upgrade.plan.copy}
      </button>
      <button class="act danger" type="button" onclick={clearPlan}>
        <Icon name="trash-2" size={13} />
        {i18n.m.upgrade.plan.clear}
      </button>
    </div>

    <h2 class="section-label">{i18n.m.upgrade.totalEyebrow}</h2>
    <div class="totals">
      {#each grandRows as key (key)}
        {@const def = resDef(key)}
        <div class="res">
          <span class="res-icon" style="--c: {def.color}" aria-hidden="true">{def.icon}</span>
          <span class="res-name">{resName(key)}</span>
          <span class="res-val">{formatQty(grand[key] ?? 0)}</span>
        </div>
        {#if key === 'refinedFireCrystal' && refineRfc > 0}
          <div class="res refine">
            <span class="res-icon" style="--c: #fb923c" aria-hidden="true">🔥</span>
            <span class="res-name">
              {i18n.m.upgrade.plan.toRefine}
              <span class="approx">{i18n.m.upgrade.plan.approx}</span>
            </span>
            <div class="refine-right">
              <div class="refine-num">
                <span class="res-val">~{formatQty(refineFc)}</span>
                <span class="refine-total"
                  >{fmt(i18n.m.upgrade.refinement.totalLabel, {
                    n: formatQty((grand.fireCrystal ?? 0) + refineFc)
                  })}</span
                >
              </div>
              <Segmented
                value={refineMode}
                ariaLabel={i18n.m.upgrade.refinement.intensity}
                options={PRESETS.map((p) => ({
                  value: p.key,
                  label: (i18n.m.upgrade.refinement as Record<string, string>)[p.key]
                }))}
                onChange={(v) => (refineMode = v)}
              />
            </div>
          </div>
        {/if}
      {/each}
    </div>

    <DeficitPanel needed={grand} />

    {#if timeRows.length > 0 || learningTime > 0 || refineRfc > 0}
      <div class="meta-row">
        {#each timeRows as t (t.cat)}
          <div class="meta">
            <span class="meta-label">{timeLabel(t.cat)}</span>
            <span class="meta-val">{formatDuration(speedups.any ? t.left : t.secs)}</span>
            {#if speedups.seconds(t.cat) > 0}
              <span class="meta-base">{i18n.m.upgrade.boosters.base}: {formatDuration(t.secs)}</span
              >
            {/if}
          </div>
        {/each}
        {#if learningTime > 0}
          <div class="meta">
            <span class="meta-label">{i18n.m.upgrade.experts.learningTime}</span>
            <span class="meta-val">{formatDuration(learningTime)}</span>
          </div>
        {/if}
        {#if refineRfc > 0}
          <div class="meta">
            <span class="meta-label">✨ {i18n.m.upgrade.refinement.refineTime}</span>
            <span class="meta-val">{refineWeeks}</span>
            <span class="meta-base">{refineModeName}</span>
          </div>
        {/if}
      </div>
      {#if timeRows.length > 0}
        <p class="parallel">{i18n.m.upgrade.plan.parallel}</p>
      {/if}
    {/if}

    {#if timeRows.length > 0}
      <div class="speedups" class:open={speedOpen}>
        <button
          class="sp-head"
          type="button"
          aria-expanded={speedOpen}
          onclick={() => (speedOpen = !speedOpen)}
        >
          <span class="sp-icon" aria-hidden="true">⏩</span>
          <span class="sp-title">{i18n.m.upgrade.plan.speedups.title}</span>
          <Icon name="chevron-down" size={14} class="caret {speedOpen ? 'up' : ''}" />
        </button>
        {#if speedOpen}
          <div class="sp-body">
            <p class="sp-hint">{i18n.m.upgrade.plan.speedups.hint}</p>
            {#each timeRows as t (t.cat)}
              <div class="sp-row">
                <span class="sp-label">{timeLabel(t.cat)}</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  inputmode="decimal"
                  value={speedups.days(t.cat)}
                  oninput={(e) => speedups.setDays(t.cat, Number(e.currentTarget.value))}
                  aria-label="{timeLabel(t.cat)} {i18n.m.upgrade.plan.speedups.days}"
                />
                <span class="sp-unit">{i18n.m.upgrade.plan.speedups.days}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <h2 class="section-label">{i18n.m.upgrade.plan.includes}</h2>
    <div class="lines">
      {#each adjLines as l (l.id)}
        <div class="line" class:off={!enabled.has(l.id)}>
          <button
            class="line-toggle"
            class:on={enabled.has(l.id)}
            type="button"
            onclick={() => toggleLine(l.id)}
            aria-pressed={enabled.has(l.id)}
            title={i18n.m.upgrade.plan.includeToggle}
            aria-label={i18n.m.upgrade.plan.includeToggle}
          >
            {#if enabled.has(l.id)}<Icon name="check" size={13} />{/if}
          </button>
          <a class="line-link" href="{base}{l.route ?? `/upgrade/${l.id}`}">
            <div class="line-head">
              <span class="line-name">{catName(l.id)}</span>
              <span class="line-res">
                {#each presentResources(l.totals).slice(0, 4) as k (k)}
                  <span class="chip">{resDef(k).icon} {formatQty(l.totals[k] ?? 0)}</span>
                {/each}
              </span>
            </div>
            {#if l.detail.length > 0}
              <div class="line-detail">
                {#each l.detail.slice(0, 6) as d, i (i)}
                  <span class="dchip">{d}</span>
                {/each}
                {#if l.detail.length > 6}
                  <span class="dchip more">+{l.detail.length - 6}</span>
                {/if}
              </div>
            {/if}
          </a>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .empty {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-dim);
  }
  .cta {
    display: inline-block;
    margin-top: 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--accent);
  }
  .section-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 16px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  .act {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .act:hover {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .act.danger:hover {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
  }
  .totals {
    display: grid;
    gap: 10px;
  }
  .res {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .res-icon {
    font-size: 20px;
    line-height: 1;
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--c) 40%, transparent));
  }
  .res-name {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-mid);
    flex: 1;
  }
  .res-val {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 22px;
    letter-spacing: -0.01em;
  }
  .res.refine {
    flex-wrap: wrap;
    border-style: dashed;
  }
  .approx {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    margin-inline-start: 6px;
  }
  .refine-num {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  .refine-total {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
  }
  .refine-right {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-inline-start: auto;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }
  .meta {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .meta-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .meta-val {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 18px;
  }
  .meta-base {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 2px;
  }
  .parallel {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    margin: 10px 0 0;
  }
  .speedups {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    margin: 12px 0 0;
  }
  .speedups.open {
    border-color: var(--border-accent);
  }
  .sp-head {
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
  .sp-icon {
    font-size: 14px;
  }
  .sp-title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .sp-head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
    margin-inline-start: auto;
  }
  .sp-head :global(.caret.up) {
    transform: rotate(180deg);
  }
  .sp-body {
    padding: 0 16px 14px;
    display: grid;
    gap: 10px;
  }
  .sp-hint {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
    margin: 0;
  }
  .sp-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sp-label {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .sp-row input {
    width: 96px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 7px 10px;
    text-align: end;
  }
  .sp-row input:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .sp-unit {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    min-width: 28px;
  }
  .lines {
    display: grid;
    gap: 8px;
  }
  .line {
    display: flex;
    align-items: stretch;
    gap: 10px;
  }
  .line.off {
    opacity: 0.42;
  }
  .line-toggle {
    flex-shrink: 0;
    align-self: center;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-dim);
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .line-toggle.on {
    background: var(--accent-glow);
    border-color: var(--border-accent);
    color: var(--accent);
  }
  .line-link {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s ease;
  }
  .line-link:hover {
    border-color: var(--border-accent);
  }
  .line-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .line-name {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 16px;
  }
  .line-res {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }
  .chip {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
  }
  .line-detail {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .dchip {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 2px 8px;
  }
  .dchip.more {
    color: var(--text-mid);
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
