<script lang="ts">
  /**
   * Reusable totals view for the additive calculators. Renders the "TOTAL"
   * eyebrow + a Summed | Individual toggle: summed combines every item's
   * resources; individual shows each item's own breakdown. Time stays on the
   * page (it varies with boosters/speedups). `adjust` lets a page tweak a
   * displayed amount (e.g. the buildings Zinman cut).
   */
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import { addBags, presentResources, formatQty } from './engine';
  import { type ResourceBag } from './types';
  import ResourceIcon from '$lib/components/ResourceIcon.svelte';
  import EmojiIcon from '$lib/components/EmojiIcon.svelte';
  import { totalsMode } from './totals-mode.svelte';

  interface Item {
    label: string;
    totals: ResourceBag;
  }
  interface Props {
    items: Item[];
    adjust?: (key: string, amount: number) => number;
    emptyHint: string;
    /** Refinement FC (selected intensity) shown as a "+ refinement" total under FC. */
    fcRefine?: number;
  }
  let { items, adjust = (_k, a) => a, emptyHint, fcRefine = 0 }: Props = $props();

  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const amt = (b: ResourceBag, k: string) => adjust(k, b[k as keyof ResourceBag] ?? 0);

  const summed = $derived(items.reduce<ResourceBag>((acc, it) => addBags(acc, it.totals), {}));
  const summedRows = $derived(presentResources(summed));
  const nonEmpty = $derived(items.filter((it) => presentResources(it.totals).length > 0));
</script>

<div class="head">
  <h2 class="section-label">
    <EmojiIcon name="shopping-cart" size={14} />
    {i18n.m.upgrade.totalEyebrow}
  </h2>
  {#if nonEmpty.length > 1}
    <div class="seg">
      <button
        class="seg-btn"
        class:active={totalsMode.value === 'sum'}
        type="button"
        onclick={() => totalsMode.set('sum')}>{i18n.m.upgrade.summed}</button
      >
      <button
        class="seg-btn"
        class:active={totalsMode.value === 'individual'}
        type="button"
        onclick={() => totalsMode.set('individual')}>{i18n.m.upgrade.individual}</button
      >
    </div>
  {/if}
</div>

{#if summedRows.length === 0}
  <p class="empty">{emptyHint}</p>
{:else if totalsMode.value === 'individual' && nonEmpty.length > 1}
  <div class="groups">
    {#each nonEmpty as it (it.label)}
      <div class="group">
        <span class="g-name">{it.label}</span>
        <div class="totals">
          {#each presentResources(it.totals) as k (k)}
            <div class="res">
              <span class="res-icon"><ResourceIcon resource={k} /></span>
              <span class="res-name">{resName(k)}</span>
              <span class="res-val">{formatQty(amt(it.totals, k))}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="totals">
    {#each summedRows as k (k)}
      <div class="res">
        <span class="res-icon"><ResourceIcon resource={k} /></span>
        <span class="res-name">{resName(k)}</span>
        <span class="res-val-wrap">
          <span class="res-val">{formatQty(amt(summed, k))}</span>
          {#if k === 'fireCrystal' && fcRefine > 0}
            <span class="res-sub"
              >{fmt(i18n.m.upgrade.refinement.totalLabel, {
                n: formatQty(amt(summed, k) + fcRefine)
              })}</span
            >
          {/if}
        </span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .head .section-label {
    flex: 1;
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
    margin: 8px 0 16px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .seg {
    display: inline-flex;
    flex-shrink: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 3px;
    gap: 2px;
  }
  .seg-btn {
    background: none;
    border: none;
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 5px 12px;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease;
  }
  .seg-btn.active {
    background: var(--bg-soft);
    color: var(--text);
  }
  .empty {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-dim);
  }
  .groups {
    display: grid;
    gap: 16px;
  }
  .g-name {
    display: block;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
    margin-bottom: 8px;
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
    display: inline-flex;
    line-height: 1;
  }
  .res-name {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-mid);
    flex: 1;
  }
  .res-val-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  .res-val {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 22px;
    letter-spacing: -0.01em;
  }
  .res-sub {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
  }
</style>
