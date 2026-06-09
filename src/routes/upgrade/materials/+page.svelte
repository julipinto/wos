<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { RESOURCES } from '$lib/tools/upgrade/types';
  import { MATERIALS, MATERIAL_SYSTEMS, type MaterialSystem } from '$lib/tools/upgrade/materials';

  const resDef = (k: string) => RESOURCES.find((r) => r.key === k);
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k] ?? k;
  const sysLabel = (s: MaterialSystem) =>
    (i18n.m.upgrade.materials.systems as Record<string, string>)[s];
  const confLabel = (c: string) => (i18n.m.upgrade.materials.conf as Record<string, string>)[c];
  const bySystem = (s: MaterialSystem) => MATERIALS.filter((m) => m.system === s);
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.materials} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.materials}
    sub={i18n.m.upgrade.materials.sub}
    backHref="/upgrade"
  />

  <p class="caveat">
    ℹ️ {i18n.m.upgrade.materials.caveat}
    <span class="conf-note">{i18n.m.upgrade.materials.confNote}</span>
  </p>

  {#each MATERIAL_SYSTEMS as sys (sys)}
    <h2 class="section-label">{sysLabel(sys)}</h2>
    <div class="mats">
      {#each bySystem(sys) as m (m.key)}
        {@const def = resDef(m.key)}
        <div class="mat">
          <div class="mat-head">
            <span class="mat-icon" style="--c: {def?.color ?? '#888'}" aria-hidden="true"
              >{def?.icon ?? '•'}</span
            >
            <span class="mat-name">{resName(m.key)}</span>
            <span class="conf conf--{m.confidence}">{confLabel(m.confidence)}</span>
          </div>
          <p class="mat-use">{m.use}</p>
          <div class="srcs">
            {#each m.sources as s (s)}<span class="src">{s}</span>{/each}
          </div>
          {#if m.note}<p class="mat-note">{m.note}</p>{/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .caveat {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 10px 14px;
    margin: 0 0 20px;
  }
  .conf-note {
    display: block;
    margin-top: 6px;
    color: var(--text-dim);
    opacity: 0.85;
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
    margin: 20px 0 12px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .mats {
    display: grid;
    gap: 10px;
  }
  .mat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 14px 16px;
  }
  .mat-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .mat-icon {
    font-size: 18px;
    line-height: 1;
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--c) 40%, transparent));
  }
  .mat-name {
    flex: 1;
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 16px;
  }
  .conf {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: var(--r-pill);
    border: 1px solid var(--border);
    color: var(--text-dim);
  }
  .conf--high {
    color: #4ade80;
    border-color: rgba(74, 222, 128, 0.4);
  }
  .conf--medium {
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.4);
  }
  .conf--low {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
  }
  .mat-use {
    margin: 0 0 10px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-mid);
  }
  .srcs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .src {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text);
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 4px 10px;
  }
  .mat-note {
    margin: 10px 0 0;
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.5;
    color: var(--text-dim);
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
