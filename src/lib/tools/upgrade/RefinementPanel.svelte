<script lang="ts">
  import { i18n, fmt, groupNumber } from '$lib/i18n/index.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import { PRESETS, planById, estimate } from './refinement';
  import { refinementStore } from './refinement-store.svelte';

  // The detailed refinement view, shared by the Buildings tool and My Plan.
  // What matters near SvS isn't what you've spent — it's what's LEFT to refine,
  // so we work from (needed − already saved) and estimate FC + a typical band.
  interface Props {
    /** Refined Fire Crystals the plan/upgrade needs in total. */
    rfc: number;
    /** Other Fire Crystals the plan needs directly (for the all-in total). */
    directFc?: number;
  }
  let { rfc, directFc = 0 }: Props = $props();

  const t = $derived(i18n.m.upgrade.refinement);
  const tx = $derived(t as unknown as Record<string, string>);

  // "From plan" vs "Type" (what-if). In manual mode the number you type IS the
  // amount left to refine — a pure what-if, no stockpile subtracted.
  let manual = $state(false);
  let manualRfc = $state(0);

  const plan = $derived(
    planById(PRESETS.find((p) => p.key === refinementStore.intensity)?.plan ?? 'L3')
  );

  // RFC still to refine: typed target, or (needed − saved RFC), clamped at 0.
  const netRfc = $derived(
    manual ? Math.max(0, manualRfc) : Math.max(0, rfc - refinementStore.stockRfc)
  );
  const pctDone = $derived(
    rfc > 0 ? Math.min(100, Math.round((refinementStore.stockRfc / rfc) * 100)) : 0
  );

  const est = $derived(estimate(netRfc, plan));
  // Saved FC abates the bill of what's left to farm, clamped at 0.
  const fcTotal = $derived(Math.max(0, est.fcTotal - refinementStore.stockFc));
  const fcLow = $derived(Math.max(0, est.fcLow - refinementStore.stockFc));
  const fcHigh = $derived(Math.max(0, est.fcHigh - refinementStore.stockFc));
  const hasBand = $derived(fcHigh > fcLow);

  const timeLabel = $derived(
    est.weeks >= 8
      ? fmt(t.weeksMonths, { n: est.weeks, m: Math.round(est.weeks / 4.345) })
      : fmt(t.weeks, { n: est.weeks })
  );
  const tipKey = $derived(
    'tip' + refinementStore.intensity[0].toUpperCase() + refinementStore.intensity.slice(1)
  );

  const num = (e: Event) => {
    const v = Number((e.currentTarget as HTMLInputElement).value);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
</script>

<section class="refine">
  <div class="head">
    <span class="eyebrow">✨ {t.title}</span>
    <div class="src">
      <button class="src-btn" class:on={!manual} type="button" onclick={() => (manual = false)}>
        {t.fromPlan}
      </button>
      <button class="src-btn" class:on={manual} type="button" onclick={() => (manual = true)}>
        {t.manualToggle}
      </button>
    </div>
  </div>

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
    <!-- Overview: total → minus what you've saved → what's left. -->
    <div class="overview">
      <div class="ov-row">
        <span class="ov-label">{t.totalNeeded}</span>
        <span class="ov-val">{groupNumber(rfc)} RFC</span>
      </div>
      <label class="ov-row input">
        <span class="ov-label">{t.haveSaved}</span>
        <span class="ov-input">
          −
          <input
            type="number"
            min="0"
            inputmode="numeric"
            value={refinementStore.stockRfc || ''}
            oninput={(e) => (refinementStore.stockRfc = num(e))}
            placeholder="0"
          />
          RFC
        </span>
      </label>
      <div class="ov-row total">
        <span class="ov-label">{t.stillToRefine}</span>
        <span class="ov-val big">{groupNumber(netRfc)} RFC</span>
      </div>
      <div class="bar" role="presentation">
        <div class="bar-fill" style="width: {pctDone}%"></div>
      </div>
      <span class="pct">{fmt(t.ready, { n: pctDone })}</span>
    </div>
  {/if}

  <div class="intensity">
    <span class="field-label">{t.intensity}</span>
    <Segmented
      value={refinementStore.intensity}
      ariaLabel={t.intensity}
      options={PRESETS.map((p) => ({ value: p.key, label: tx[p.key] }))}
      onChange={(v) => (refinementStore.intensity = v)}
    />
  </div>

  <div class="meta-row">
    <div class="meta">
      <span class="meta-label">{t.fcNeeded}</span>
      <span class="meta-val">🔥 {groupNumber(fcTotal)}</span>
      {#if hasBand}
        <span class="meta-base"
          >{fmt(t.typical, { low: groupNumber(fcLow), high: groupNumber(fcHigh) })}</span
        >
      {/if}
      <span class="meta-base">{fmt(t.perRfc, { n: est.fcPerRfc.toFixed(1) })}</span>
    </div>
    <div class="meta">
      <span class="meta-label">{t.time}</span>
      <span class="meta-val">{timeLabel}</span>
    </div>
  </div>

  <label class="field inline">
    <span class="field-label">{t.savedFcLabel}</span>
    <span class="ov-input">
      −
      <input
        type="number"
        min="0"
        inputmode="numeric"
        value={refinementStore.stockFc || ''}
        oninput={(e) => (refinementStore.stockFc = num(e))}
        placeholder="0"
      />
      FC
    </span>
  </label>

  {#if directFc > 0}
    <p class="total-line">{fmt(t.totalLabel, { n: groupNumber(directFc + fcTotal) })}</p>
  {/if}

  {#if tx[tipKey]}
    <p class="tip">💡 {tx[tipKey]}</p>
  {/if}

  <details class="method">
    <summary>ⓘ {t.methodTitle}</summary>
    <p>{t.methodSources}</p>
    <p>{t.methodEstimate}</p>
    <p>{t.methodBand}</p>
  </details>
</section>

<style>
  .refine {
    margin-top: 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 16px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #c084fc;
  }
  .src {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
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

  .overview {
    margin-bottom: 14px;
  }
  .ov-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
  }
  .ov-row.total {
    border-top: 1px solid var(--border);
    margin-top: 4px;
    padding-top: 8px;
  }
  .ov-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
  }
  .ov-val {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text);
  }
  .ov-val.big {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 20px;
  }
  .ov-input {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .ov-input input,
  .field input {
    width: 84px;
    background: var(--bg-soft, rgba(0, 0, 0, 0.2));
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text);
    text-align: right;
  }
  .bar {
    margin-top: 8px;
    height: 6px;
    border-radius: 999px;
    background: var(--bg-soft, rgba(0, 0, 0, 0.25));
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #fb923c, #c084fc);
    transition: width 0.25s ease;
  }
  .pct {
    display: block;
    margin-top: 4px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }
  .field.inline {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
  }
  .intensity {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .meta-row {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .meta-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .meta-val {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 24px;
    color: var(--text);
  }
  .meta-base {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
  }
  .total-line {
    margin: 12px 0 0;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .tip {
    margin: 12px 0 0;
    padding: 10px 12px;
    background: rgba(251, 146, 60, 0.08);
    border: 1px solid rgba(251, 146, 60, 0.25);
    border-radius: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-mid);
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
