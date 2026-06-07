<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import {
    sumLadder,
    combine,
    formatQty,
    formatDuration,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { RESOURCES } from '$lib/tools/upgrade/types';
  import { EXPERTS } from '$lib/tools/upgrade/data/experts';
  import { EXPERT_SKILLS } from '$lib/tools/upgrade/data/expertSkills';
  import { readJson, writeJson } from '$lib/utils/storage';

  type Mode = 'affinity' | 'skills';
  let mode = $state<Mode>(
    readJson<Mode>('upgrade-experts-mode-v1') === 'skills' ? 'skills' : 'affinity'
  );
  function setMode(m: Mode) {
    mode = m;
    writeJson('upgrade-experts-mode-v1', m);
  }

  // --- Affinity track (Expert Sigils) ---
  const STORAGE = 'upgrade-experts-v1';
  interface Row {
    expert: string;
    from: string;
    to: string;
  }
  const byId = (id: string) => EXPERTS.find((e) => e.id === id);
  function load(): Row[] {
    const raw = readJson<Row[]>(STORAGE);
    return Array.isArray(raw) ? raw.filter((r) => byId(r.expert)) : [];
  }
  const rows = $state<Row[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      rows.map((r) => ({ ...r }))
    );

  const available = $derived(EXPERTS.filter((e) => !rows.some((r) => r.expert === e.id)));
  const labels = (id: string) => (byId(id)?.ladder ?? []).map((l) => l.label);

  function addExpert(id: string) {
    const e = byId(id);
    if (!e) return;
    rows.push({ expert: id, from: e.ladder[0].label, to: e.ladder[e.ladder.length - 1].label });
    persist();
  }
  function removeRow(i: number) {
    rows.splice(i, 1);
    persist();
  }

  const result = $derived(
    combine(rows.map((r) => sumLadder(byId(r.expert)?.ladder ?? [], r.from, r.to))).totals
  );
  const totalRows = $derived(presentResources(result));

  // --- Skill track (Books of Knowledge) ---
  const SKILL_STORAGE = 'upgrade-expertskills-v1';
  interface SkillRow {
    skill: string;
    from: string;
    to: string;
  }
  const skillById = (id: string) => EXPERT_SKILLS.find((s) => s.id === id);
  function loadSkills(): SkillRow[] {
    const raw = readJson<SkillRow[]>(SKILL_STORAGE);
    return Array.isArray(raw) ? raw.filter((r) => skillById(r.skill)) : [];
  }
  const skillRows = $state<SkillRow[]>(loadSkills());
  const persistSkills = () =>
    writeJson(
      SKILL_STORAGE,
      skillRows.map((r) => ({ ...r }))
    );
  const skillLabels = (id: string) => (skillById(id)?.ladder ?? []).map((l) => l.label);
  const availableSkills = $derived(
    EXPERT_SKILLS.filter((s) => !skillRows.some((r) => r.skill === s.id))
  );
  // Group the add-chips by expert so the 36 skills stay browsable.
  const availableByExpert = $derived(
    EXPERTS.map((e) => ({
      name: e.name,
      skills: availableSkills.filter((s) => s.expertId === e.id)
    })).filter((g) => g.skills.length > 0)
  );
  function addSkill(id: string) {
    const s = skillById(id);
    if (!s) return;
    skillRows.push({ skill: id, from: s.ladder[0].label, to: s.ladder[s.ladder.length - 1].label });
    persistSkills();
  }
  function removeSkillRow(i: number) {
    skillRows.splice(i, 1);
    persistSkills();
  }
  const skillResult = $derived(
    combine(skillRows.map((r) => sumLadder(skillById(r.skill)?.ladder ?? [], r.from, r.to)))
  );
  const skillBooks = $derived(skillResult.totals.bookOfKnowledge ?? 0);

  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.experts} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.experts}
    sub={i18n.m.upgrade.experts.sub}
    backHref="/upgrade"
  />

  <div class="seg">
    <button
      class="seg-btn"
      class:active={mode === 'affinity'}
      type="button"
      onclick={() => setMode('affinity')}>{i18n.m.upgrade.experts.affinity}</button
    >
    <button
      class="seg-btn"
      class:active={mode === 'skills'}
      type="button"
      onclick={() => setMode('skills')}>{i18n.m.upgrade.experts.skills}</button
    >
  </div>

  {#if mode === 'affinity'}
    {#if rows.length > 0}
      <div class="rows">
        {#each rows as row, i (row.expert)}
          {@const e = byId(row.expert)}
          <div class="row">
            <span class="ex-name">{e?.name}<span class="focus">{e?.focus}</span></span>
            <div class="row-controls">
              <RangeSelect
                labels={labels(row.expert)}
                from={row.from}
                to={row.to}
                onChange={(f, t) => {
                  rows[i].from = f;
                  rows[i].to = t;
                  persist();
                }}
                ariaFrom="{e?.name} {i18n.m.upgrade.from}"
                ariaTo="{e?.name} {i18n.m.upgrade.to}"
              />
              <button
                class="remove"
                type="button"
                onclick={() => removeRow(i)}
                aria-label={i18n.m.upgrade.troops.remove}>×</button
              >
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if available.length > 0}
      <div class="add">
        <span class="field-label">{i18n.m.upgrade.add}</span>
        <div class="chips">
          {#each available as e (e.id)}
            <button class="chip" type="button" onclick={() => addExpert(e.id)}>+ {e.name}</button>
          {/each}
        </div>
      </div>
    {/if}

    <h2 class="section-label">{i18n.m.upgrade.totalEyebrow}</h2>
    {#if totalRows.length === 0}
      <p class="empty">{i18n.m.upgrade.addHint}</p>
    {:else}
      <div class="totals">
        {#each totalRows as key (key)}
          {@const def = resDef(key)}
          <div class="res">
            <span class="res-icon" style="--c: {def.color}" aria-hidden="true">{def.icon}</span>
            <span class="res-name">{resName(key)}</span>
            <span class="res-val">{formatQty(result[key] ?? 0)}</span>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    {#if skillRows.length > 0}
      <div class="rows">
        {#each skillRows as row, i (row.skill)}
          {@const s = skillById(row.skill)}
          <div class="row">
            <span class="ex-name">{s?.skill}<span class="focus">{s?.expertName}</span></span>
            <div class="row-controls">
              <RangeSelect
                labels={skillLabels(row.skill)}
                from={row.from}
                to={row.to}
                onChange={(f, t) => {
                  skillRows[i].from = f;
                  skillRows[i].to = t;
                  persistSkills();
                }}
                ariaFrom="{s?.skill} {i18n.m.upgrade.from}"
                ariaTo="{s?.skill} {i18n.m.upgrade.to}"
              />
              <button
                class="remove"
                type="button"
                onclick={() => removeSkillRow(i)}
                aria-label={i18n.m.upgrade.troops.remove}>×</button
              >
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if availableByExpert.length > 0}
      <div class="add">
        <span class="field-label">{i18n.m.upgrade.add}</span>
        {#each availableByExpert as g (g.name)}
          <span class="group-label">{g.name}</span>
          <div class="chips">
            {#each g.skills as s (s.id)}
              <button class="chip" type="button" onclick={() => addSkill(s.id)}>+ {s.skill}</button>
            {/each}
          </div>
        {/each}
      </div>
    {/if}

    <h2 class="section-label">{i18n.m.upgrade.totalEyebrow}</h2>
    {#if skillBooks === 0 && skillResult.time === 0}
      <p class="empty">{i18n.m.upgrade.addHint}</p>
    {:else}
      <div class="totals">
        <div class="res">
          <span class="res-icon" style="--c: {resDef('bookOfKnowledge').color}" aria-hidden="true"
            >{resDef('bookOfKnowledge').icon}</span
          >
          <span class="res-name">{resName('bookOfKnowledge')}</span>
          <span class="res-val">{formatQty(skillBooks)}</span>
        </div>
      </div>
      {#if skillResult.time > 0}
        <div class="meta-row">
          <div class="meta">
            <span class="meta-label">{i18n.m.upgrade.experts.learningTime}</span>
            <span class="meta-val">{formatDuration(skillResult.time)}</span>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .seg {
    display: inline-flex;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 3px;
    gap: 2px;
    margin-bottom: 18px;
  }
  .seg-btn {
    background: none;
    border: none;
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 6px 16px;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease;
  }
  .seg-btn.active {
    background: var(--bg-soft);
    color: var(--text);
  }
  .group-label {
    display: block;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin: 8px 0 4px 2px;
  }
  .meta-row {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }
  .meta {
    flex: 1;
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
    font-size: 20px;
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .rows {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .ex-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .focus {
    font-size: 10px;
    color: var(--text-dim);
  }
  .row-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .remove {
    flex-shrink: 0;
    width: 36px;
    height: 44px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-dim);
    font-size: 20px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .remove:hover {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
  }
  .add {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 28px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 14px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .chip:hover {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--surface-hover);
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
  .empty {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-dim);
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
