<script lang="ts">
  /**
   * "What's left" — enter your current stock per resource and see the live
   * shortfall (deficit = needed − have, clamped at 0). Collapsed by default;
   * the stock persists so it survives navigation.
   */
  import Icon from '$lib/components/Icon.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { formatQty, presentResources } from './engine';
  import { RESOURCES, type ResourceBag } from './types';
  import { readJson, writeJson } from '$lib/utils/storage';

  interface Props {
    /** The plan's needed totals (already booster/Zinman-adjusted). */
    needed: ResourceBag;
  }
  let { needed }: Props = $props();

  const STORAGE = 'upgrade-stock-v1';
  const stock = $state<Record<string, number>>(readJson<Record<string, number>>(STORAGE) ?? {});
  const persist = () => writeJson(STORAGE, { ...stock });
  function set(key: string, v: number) {
    stock[key] = Number.isFinite(v) && v > 0 ? v : 0;
    persist();
  }

  let open = $state(false);
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const keys = $derived(presentResources(needed));
  const deficit = (k: string) =>
    Math.max(0, (needed[k as keyof ResourceBag] ?? 0) - (stock[k] ?? 0));
  const shortCount = $derived(keys.filter((k) => deficit(k) > 0).length);
</script>

{#if keys.length > 0}
  <div class="stock" class:open>
    <button class="head" type="button" aria-expanded={open} onclick={() => (open = !open)}>
      <span class="icon" aria-hidden="true">🎒</span>
      <span class="title">{i18n.m.upgrade.plan.stock.title}</span>
      {#if !open && shortCount > 0}<span class="summary">{shortCount}</span>{/if}
      <Icon name="chevron-down" size={14} class="caret {open ? 'up' : ''}" />
    </button>

    {#if open}
      <div class="body">
        <p class="hint">{i18n.m.upgrade.plan.stock.hint}</p>
        <div class="rows">
          {#each keys as k (k)}
            {@const d = deficit(k)}
            <div class="row" class:covered={d === 0}>
              <span class="ic" style="--c: {resDef(k).color}" aria-hidden="true"
                >{resDef(k).icon}</span
              >
              <span class="name"
                >{resName(k)}<span class="need">/ {formatQty(needed[k] ?? 0)}</span></span
              >
              <span class="num">
                <NumberInput
                  value={stock[k] ?? 0}
                  onChange={(n) => set(k, n)}
                  ariaLabel="{resName(k)} — {i18n.m.upgrade.plan.stock.have}"
                />
              </span>
              <span class="left" class:ok={d === 0}>
                {d > 0 ? formatQty(d) : '✓'}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .stock {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    margin: 16px 0 0;
  }
  .stock.open {
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
  .icon {
    font-size: 14px;
  }
  .title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .summary {
    margin-inline-start: auto;
    font-size: 12px;
    color: #fb7185;
  }
  .head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
    margin-inline-start: auto;
  }
  .summary + :global(.caret) {
    margin-inline-start: 8px;
  }
  .head :global(.caret.up) {
    transform: rotate(180deg);
  }
  .body {
    padding: 0 16px 14px;
    display: grid;
    gap: 10px;
  }
  .hint {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
    margin: 0;
  }
  .rows {
    display: grid;
    gap: 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ic {
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 40%, transparent));
  }
  .name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .need {
    font-size: 10px;
    color: var(--text-dim);
  }
  .num {
    width: 116px;
    flex-shrink: 0;
  }
  .left {
    min-width: 64px;
    text-align: end;
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 600;
    color: #fb7185;
  }
  .left.ok {
    color: #4ade80;
  }
</style>
