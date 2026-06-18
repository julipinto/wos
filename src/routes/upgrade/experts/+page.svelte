<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import RemoveButton from '$lib/components/RemoveButton.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import Totals from '$lib/tools/upgrade/Totals.svelte';
  import DeficitPanel from '$lib/tools/upgrade/DeficitPanel.svelte';
  import { sumLadder, combine, formatDuration, addBags } from '$lib/tools/upgrade/engine';
  import { type ResourceBag } from '$lib/tools/upgrade/types';
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

  const affinityItems = $derived(
    rows.map((r) => ({
      label: byId(r.expert)?.name ?? r.expert,
      totals: sumLadder(byId(r.expert)?.ladder ?? [], r.from, r.to).totals
    }))
  );

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
  const skillItems = $derived(
    skillRows.map((r) => ({
      label: skillById(r.skill)?.skill ?? r.skill,
      totals: sumLadder(skillById(r.skill)?.ladder ?? [], r.from, r.to).totals
    }))
  );
  const skillResult = $derived(
    combine(skillRows.map((r) => sumLadder(skillById(r.skill)?.ladder ?? [], r.from, r.to)))
  );

  const needed = $derived(
    [...affinityItems, ...skillItems].reduce(
      (acc, it) => addBags(acc, it.totals),
      {} as ResourceBag
    )
  );
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

  <div class="seg-wrap">
    <Segmented
      value={mode}
      options={[
        { value: 'affinity', label: i18n.m.upgrade.experts.affinity },
        { value: 'skills', label: i18n.m.upgrade.experts.skills }
      ]}
      onChange={(v) => setMode(v as Mode)}
    />
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
              <RemoveButton onclick={() => removeRow(i)} />
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

    <Totals items={affinityItems} emptyHint={i18n.m.upgrade.addHint} />
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
              <RemoveButton onclick={() => removeSkillRow(i)} />
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

    <Totals items={skillItems} emptyHint={i18n.m.upgrade.addHint} />
    {#if skillResult.time > 0}
      <div class="meta-row">
        <div class="meta">
          <span class="meta-label">{i18n.m.upgrade.experts.learningTime}</span>
          <span class="meta-val">{formatDuration(skillResult.time)}</span>
        </div>
      </div>
    {/if}
  {/if}

  <DeficitPanel {needed} />
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .seg-wrap {
    margin-bottom: 18px;
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
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
