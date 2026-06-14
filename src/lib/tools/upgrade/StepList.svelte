<script lang="ts">
  /**
   * Collapsible per-level breakdown ("steps"). Shows each upgrade level in the
   * chosen range with its BASE in-game cost + time — the reference detail, while
   * the page's "Total" already reflects boosters. Collapsed by default so it
   * never dominates the page.
   */
  import Icon from '$lib/components/Icon.svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { formatQty, formatDuration, presentResources } from './engine';
  import { RESOURCES, type LevelCost } from './types';

  interface Props {
    /** The levels to list (already sliced to the from→to range), tagged by building. */
    steps: (LevelCost & { group?: string })[];
  }
  let { steps }: Props = $props();

  let open = $state(false);
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

{#if steps.length > 0}
  <div class="steps" class:open>
    <button class="head" type="button" aria-expanded={open} onclick={() => (open = !open)}>
      <span class="title">{i18n.m.upgrade.steps.title}</span>
      <span class="count">{steps.length}</span>
      <Icon name="chevron-down" size={14} class="caret {open ? 'up' : ''}" />
    </button>

    {#if open}
      <ol class="list">
        {#each steps as s, i (i)}
          {#if s.group && s.group !== steps[i - 1]?.group}
            <li class="group-head">{s.group}</li>
          {/if}
          <li class="step">
            <span class="step-label">{s.label}</span>
            <span class="step-body">
              <span class="step-res">
                {#each presentResources(s.cost) as k (k)}
                  <span class="chip"
                    ><span class="ic" style="--c: {resDef(k).color}">{resDef(k).icon}</span>
                    {formatQty(s.cost[k] ?? 0)}</span
                  >
                {/each}
              </span>
              {#if s.time > 0}<span class="step-time">{formatDuration(s.time)}</span>{/if}
            </span>
          </li>
        {/each}
      </ol>
      <p class="caption">{i18n.m.upgrade.steps.base}</p>
    {/if}
  </div>
{/if}

<style>
  .steps {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    margin: 18px 0 0;
  }
  .steps.open {
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
  .title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .count {
    font-size: 11px;
    color: var(--text-dim);
  }
  .head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
    margin-inline-start: auto;
  }
  .head :global(.caret.up) {
    transform: rotate(180deg);
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0 16px 4px;
    display: grid;
    gap: 6px;
  }
  .group-head {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--accent);
    padding: 12px 0 2px;
  }
  .step {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
  }
  /* The first step under a group header doesn't need its own separator. */
  .group-head + .step {
    border-top: 0;
  }
  .step-label {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    min-width: 56px;
    flex-shrink: 0;
  }
  .step-body {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 12px;
    flex: 1;
    justify-content: space-between;
  }
  .step-res {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
  }
  .chip {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
    white-space: nowrap;
  }
  .ic {
    filter: drop-shadow(0 0 5px color-mix(in srgb, var(--c) 40%, transparent));
  }
  .step-time {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    white-space: nowrap;
  }
  .caption {
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.5;
    color: var(--text-dim);
    margin: 0;
    padding: 4px 16px 14px;
  }
</style>
