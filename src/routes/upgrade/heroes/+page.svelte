<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import { sumLadder, formatQty, presentResources } from '$lib/tools/upgrade/engine';
  import { RESOURCES } from '$lib/tools/upgrade/types';
  import { HERO_TRACKS } from '$lib/tools/upgrade/data/heroes';
  import { readJson, writeJson } from '$lib/utils/storage';

  interface Pair {
    from: string;
    to: string;
  }
  // One {from,to} per track, each persisted under the track's storage key.
  const state = $state<Record<string, Pair>>(
    Object.fromEntries(
      HERO_TRACKS.map((t) => {
        const labels = t.ladder.map((l) => l.label);
        const raw = readJson<Pair>(t.storageKey);
        const valid = raw && labels.includes(raw.from) && labels.includes(raw.to);
        return [t.id, valid ? raw : { from: labels[0], to: labels[labels.length - 1] }];
      })
    )
  );

  function persist(id: string) {
    const t = HERO_TRACKS.find((tr) => tr.id === id);
    if (t) writeJson(t.storageKey, { ...state[id] });
  }

  const trackName = (k: string) => (i18n.m.upgrade.heroes as Record<string, string>)[k];
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.heroes} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.heroes}
    sub={i18n.m.upgrade.heroes.sub}
    backHref="/upgrade"
  />

  {#each HERO_TRACKS as track (track.id)}
    {@const result = sumLadder(track.ladder, state[track.id].from, state[track.id].to)}
    {@const rows = presentResources(result.totals)}
    <section class="track">
      <h2 class="section-label">{trackName(track.i18n)}</h2>
      <div class="controls">
        <RangeSelect
          labels={track.ladder.map((l) => l.label)}
          from={state[track.id].from}
          to={state[track.id].to}
          onChange={(f, t) => {
            state[track.id].from = f;
            state[track.id].to = t;
            persist(track.id);
          }}
          ariaFrom="{trackName(track.i18n)} {i18n.m.upgrade.from}"
          ariaTo="{trackName(track.i18n)} {i18n.m.upgrade.to}"
        />
      </div>
      {#if rows.length > 0}
        <div class="totals">
          {#each rows as key (key)}
            {@const def = resDef(key)}
            <div class="res">
              <span class="res-icon" style="--c: {def.color}" aria-hidden="true">{def.icon}</span>
              <span class="res-name">{resName(key)}</span>
              <span class="res-val">{formatQty(result.totals[key] ?? 0)}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .track {
    margin-bottom: 28px;
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
    margin: 8px 0 14px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
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
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
