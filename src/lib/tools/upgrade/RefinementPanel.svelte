<script lang="ts">
  import { i18n, fmt, groupNumber } from '$lib/i18n/index.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import { PRESETS, planById, estimate } from './refinement';

  // Shown inside the Buildings tool when the upgrade needs Refined Fire Crystals.
  // Estimates the Fire Crystals + time to refine the RFC the calc already found.
  interface Props {
    rfc: number;
    directFc?: number;
  }
  let { rfc, directFc = 0 }: Props = $props();

  const t = $derived(i18n.m.upgrade.refinement);
  let presetKey = $state('economic');
  const plan = $derived(planById(PRESETS.find((p) => p.key === presetKey)?.plan ?? 'L3'));
  const est = $derived(estimate(rfc, plan));
  // Anchor comparison: cheapest (economic / L3) vs fastest (rush / L10).
  const ecoFc = $derived(estimate(rfc, planById('L3')).fcTotal);
  const rushFc = $derived(estimate(rfc, planById('L10')).fcTotal);

  // Weeks, with a months hint once it's a long haul.
  const timeLabel = $derived(
    est.weeks >= 8
      ? fmt(t.weeksMonths, { n: est.weeks, m: Math.round(est.weeks / 4.345) })
      : fmt(t.weeks, { n: est.weeks })
  );
</script>

<section class="refine">
  <div class="head">
    <span class="eyebrow">✨ {t.title}</span>
  </div>
  <p class="blurb">{fmt(t.blurb, { rfc: groupNumber(rfc) })}</p>

  <div class="intensity">
    <span class="field-label">{t.intensity}</span>
    <Segmented
      value={presetKey}
      ariaLabel={t.intensity}
      options={PRESETS.map((p) => ({ value: p.key, label: t[p.key as keyof typeof t] }))}
      onChange={(v) => (presetKey = v)}
    />
  </div>

  <p class="rhythm">{fmt(t.rhythm, { refines: plan.refines, fc: groupNumber(plan.fcPerWeek) })}</p>
  {#if presetKey === 'economic'}
    <p class="rhythm eco">{t.ecoNote}</p>
  {/if}

  <div class="meta-row">
    <div class="meta">
      <span class="meta-label">{t.fcNeeded}</span>
      <span class="meta-val">🔥 {groupNumber(est.fcTotal)}</span>
      <span class="meta-base">{fmt(t.perRfc, { n: est.fcPerRfc.toFixed(1) })}</span>
      {#if directFc > 0}
        <span class="meta-base"
          >{fmt(t.totalLabel, { n: groupNumber(directFc + est.fcTotal) })}</span
        >
      {/if}
    </div>
    <div class="meta">
      <span class="meta-label">{t.time}</span>
      <span class="meta-val">{timeLabel}</span>
    </div>
  </div>

  <p class="vs">{fmt(t.vs, { eco: groupNumber(ecoFc), rush: groupNumber(rushFc) })}</p>
  <p class="note">{t.note}</p>
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
    margin-bottom: 8px;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #c084fc;
  }
  .blurb {
    margin: 0 0 14px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-mid);
  }
  .intensity {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }
  .rhythm {
    margin: 0 0 4px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
  }
  .rhythm.eco {
    color: var(--text-dim);
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
  .vs {
    margin: 14px 0 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .note {
    margin: 8px 0 0;
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.5;
    color: var(--text-dim);
    opacity: 0.8;
  }
</style>
