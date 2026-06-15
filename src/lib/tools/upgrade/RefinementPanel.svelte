<script lang="ts">
  import { i18n, fmt, groupNumber } from '$lib/i18n/index.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { PRESETS, planById, estimate } from './refinement';
  import { refinementStore } from './refinement-store.svelte';

  // Refinement view, shared by the Buildings tool and My Plan. What matters near
  // SvS isn't what you've spent — it's what's LEFT to refine. So we work from
  // (needed − already saved) and surface the answer (FC + days) as a KPI hero,
  // with the four intensities as a comparison you pick by outcome.
  interface Props {
    /** Refined Fire Crystals the plan/upgrade needs in total. */
    rfc: number;
  }
  let { rfc }: Props = $props();

  const t = $derived(i18n.m.upgrade.refinement);
  const tx = $derived(t as unknown as Record<string, string>);

  // Collapsed by default (like the deficit / speedups panels); the header shows a
  // summary so the key number is visible without expanding.
  let open = $state(false);
  // "From plan" vs "Type" (what-if): in manual mode the typed number IS what's
  // left to refine — no stockpile subtracted.
  let manual = $state(false);
  let manualRfc = $state(0);

  const netRfc = $derived(
    manual ? Math.max(0, manualRfc) : Math.max(0, rfc - refinementStore.stockRfc)
  );
  const pctDone = $derived(
    rfc > 0 ? Math.min(100, Math.round((refinementStore.stockRfc / rfc) * 100)) : 0
  );

  // One estimate per intensity — drives the comparison cards; the selected one
  // is the hero. Each tier holds 20 refines (cheap-first), so the top tier is
  // ceil(refines/20) and the discount-optimal play does (refines−6) in one day.
  const rows = $derived(
    PRESETS.map((p) => {
      const plan = planById(p.plan);
      return {
        key: p.key,
        name: tx[p.key],
        est: estimate(netRfc, plan),
        refines: plan.refines,
        tier: Math.min(5, Math.ceil(plan.refines / 20)),
        bulk: Math.max(0, plan.refines - 6)
      };
    })
  );
  const cur = $derived(rows.find((r) => r.key === refinementStore.intensity) ?? rows[0]);

  const num = (e: Event) => {
    const v = Number((e.currentTarget as HTMLInputElement).value);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
</script>

<section class="refine" class:open>
  <button class="head" type="button" aria-expanded={open} onclick={() => (open = !open)}>
    <span class="eyebrow">✨ {t.title}</span>
    {#if !open}
      <span class="summary">🔥 {groupNumber(cur.est.fcTotal)} · ~{cur.est.days} {t.daysLabel}</span>
    {/if}
    <Icon name="chevron-down" size={14} class="caret {open ? 'up' : ''}" />
  </button>

  {#if open}
    <div class="body">
      <div class="src">
        <button class="src-btn" class:on={!manual} type="button" onclick={() => (manual = false)}>
          {t.fromPlan}
        </button>
        <button class="src-btn" class:on={manual} type="button" onclick={() => (manual = true)}>
          {t.manualToggle}
        </button>
      </div>

      <!-- hero: the answer for the selected intensity -->
      <div class="kpi">
        <div class="kpi-cell">
          <span class="kpi-lbl">🔥 {t.fcLabel}</span>
          <span class="kpi-num">~{groupNumber(cur.est.fcTotal)}</span>
          {#if cur.est.fcHigh > cur.est.fcLow}
            <span class="kpi-band"
              >{fmt(t.band, {
                low: groupNumber(cur.est.fcLow),
                high: groupNumber(cur.est.fcHigh),
                perRfc: cur.est.fcPerRfc.toFixed(1)
              })}</span
            >
          {/if}
        </div>
        <div class="kpi-div"></div>
        <div class="kpi-cell">
          <span class="kpi-lbl">⏱ {t.daysLabel}</span>
          <span class="kpi-num">~{cur.est.days}</span>
        </div>
      </div>

      <div class="divider"></div>

      {#if manual}
        <label class="field">
          <span class="field-label">{t.manualLabel}</span>
          <input
            type="number"
            min="0"
            inputmode="numeric"
            value={manualRfc || ''}
            oninput={(e) => (manualRfc = num(e))}
            placeholder="0"
          />
        </label>
      {:else}
        <span class="setup">
          {fmt(t.stillOf, { n: groupNumber(netRfc), total: groupNumber(rfc) })} · −
          <input
            class="saved-in"
            type="number"
            min="0"
            inputmode="numeric"
            value={refinementStore.stockRfc || ''}
            oninput={(e) => (refinementStore.stockRfc = num(e))}
            placeholder="0"
          />
          {t.savedShort} · {fmt(t.ready, { n: pctDone })}
        </span>
        <div class="bar" role="presentation"><div class="fill" style="width:{pctDone}%"></div></div>
      {/if}

      <span class="rhythm-lbl">{t.rhythmHint}</span>
      <div class="cards">
        {#each rows as r (r.key)}
          <button
            class="rcard"
            class:on={r.key === refinementStore.intensity}
            type="button"
            onclick={() => (refinementStore.intensity = r.key)}
          >
            <div class="rcard-top">
              <span class="r-name">{r.name}</span>
              <span class="r-fc">🔥 ~{groupNumber(r.est.fcTotal)}</span>
              <span class="r-days">⏱ ~{r.est.days} {t.daysLabel}</span>
            </div>
            {#if r.key === refinementStore.intensity}
              <div class="rcard-detail">
                <span>{fmt(t.weekly, { n: r.refines, tier: r.tier })}</span>
                <span class="rec">💡 {fmt(t.play, { bulk: r.bulk })}</span>
              </div>
            {/if}
          </button>
        {/each}
      </div>

      <details class="method">
        <summary>ⓘ {t.methodTitle}</summary>
        <p>{t.methodSources}</p>
        <p>{t.methodEstimate}</p>
        <p>{t.methodBand}</p>
      </details>
    </div>
  {/if}
</section>

<style>
  .refine {
    margin-top: 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .refine.open {
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
    padding: 16px;
    cursor: pointer;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #c084fc;
  }
  .summary {
    margin-inline-start: auto;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
    margin-inline-start: auto;
  }
  .summary + :global(.caret) {
    margin-inline-start: 10px;
  }
  .head :global(.caret.up) {
    transform: rotate(180deg);
  }
  .body {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
  }

  .src {
    display: inline-flex;
    align-self: flex-start;
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .src-btn {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: 4px 12px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .src-btn.on {
    background: var(--surface-2, rgba(192, 132, 252, 0.15));
    color: var(--text);
  }

  /* hero */
  .kpi {
    display: flex;
    align-items: flex-start;
    padding: 2px 0 4px;
  }
  .kpi-cell {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .kpi-lbl {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .kpi-num {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 38px;
    line-height: 1;
    color: var(--text);
  }
  .kpi-band {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    margin-top: 2px;
  }
  .kpi-div {
    width: 1px;
    align-self: stretch;
    background: var(--border);
    margin: 4px 18px;
  }

  .divider {
    height: 1px;
    background: var(--border);
    margin: 14px 0;
  }

  .setup {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.7;
  }
  .saved-in {
    width: 64px;
    text-align: right;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 2px 6px;
  }
  .bar {
    margin-top: 8px;
    height: 6px;
    border-radius: 999px;
    background: var(--bg-soft, rgba(0, 0, 0, 0.25));
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #fb923c, #c084fc);
    transition: width 0.25s ease;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field-label,
  .rhythm-lbl {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .field input {
    width: 120px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text);
    text-align: right;
  }

  .rhythm-lbl {
    margin: 16px 0 8px;
  }
  .cards {
    display: grid;
    gap: 6px;
  }
  .rcard {
    display: block;
    width: 100%;
    text-align: start;
    padding: 12px 14px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .rcard.on {
    border-color: var(--accent);
    background: var(--accent-glow, rgba(192, 132, 252, 0.12));
  }
  .rcard-top {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: baseline;
  }
  .r-name {
    font-size: 13px;
    color: var(--text);
  }
  .r-fc {
    font-size: 13px;
    color: #fb923c;
  }
  .r-days {
    font-size: 13px;
    color: var(--text-mid);
  }
  .rcard-detail {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-dim);
  }
  .rec {
    color: var(--text-mid);
    border-inline-start: 2px solid rgba(251, 146, 60, 0.5);
    padding-inline-start: 8px;
  }

  .method {
    margin-top: 14px;
  }
  .method summary {
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
    opacity: 0.85;
  }
  .method p {
    margin: 8px 0 0;
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.6;
    color: var(--text-dim);
    opacity: 0.85;
  }
</style>
