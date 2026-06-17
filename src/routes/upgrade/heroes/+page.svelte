<script lang="ts">
  /**
   * Hero roster planner. Add the heroes you'll work on this round (SvS), set
   * each one's granular ★ (star + segment + shards already banked) and exclusive
   * gear range, and get a combined shopping list. Shards bucket by the hero's
   * rarity (you can't spend Mythic shards on an Epic hero); widgets are
   * hero-specific so they're listed per hero, never pooled.
   */
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Select from '$lib/components/Select.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import DeficitPanel from '$lib/tools/upgrade/DeficitPanel.svelte';
  import {
    sumLadder,
    combine,
    addBags,
    formatQty,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { RESOURCES, type ResourceKey, type ResourceBag } from '$lib/tools/upgrade/types';
  import {
    HERO_EXCLUSIVE,
    HERO_ENHANCE,
    HERO_MASTERY,
    HERO_EMPOWER,
    HERO_GEAR_PIECES,
    GEAR_ASCENSION_COST,
    STAR_MAX_INDEX,
    STAR_SEGMENTS_PER_STAR,
    starIndex,
    starLabel,
    starShardsBetween
  } from '$lib/tools/upgrade/data/heroes';
  import {
    HERO_CATALOG,
    heroFromCatalog,
    TROOP_EMOJI,
    type HeroRarity,
    type TroopType
  } from '$lib/tools/upgrade/data/hero-catalog';
  import {
    gearStatGain,
    pieceGroup,
    type GearTroop,
    type GearStats
  } from '$lib/tools/upgrade/hero-gear-stats';
  import { readJson, writeJson } from '$lib/utils/storage';

  const SHARD_KEY: Record<HeroRarity, ResourceKey> = {
    mythic: 'mythicShard',
    epic: 'epicShard',
    rare: 'rareShard'
  };
  interface Hero {
    heroId: string; // points at HERO_CATALOG
    starFrom: number; // linear segment index 0..30
    starSaved: number; // shards banked toward the current (from) segment
    starTo: number;
    exFrom: string; // HERO_EXCLUSIVE label
    exTo: string;
  }

  const STORAGE = 'upgrade-heroes-roster-v1';
  const exLabels = HERO_EXCLUSIVE.map((l) => l.label);
  const DEFAULT_HERO = HERO_CATALOG.find((c) => c.id === 'jeronimo')?.id ?? HERO_CATALOG[0].id;
  function cleanHero(h: Partial<Hero> & { name?: string }): Hero {
    const clampIdx = (n: unknown) =>
      Math.max(0, Math.min(STAR_MAX_INDEX, Math.round(Number(n) || 0)));
    // Migrate older rows that stored a free-text name → match it to the catalog.
    const byName = h.name ? HERO_CATALOG.find((c) => c.name === h.name)?.id : undefined;
    const heroId = heroFromCatalog(h.heroId ?? '')?.id ?? byName ?? DEFAULT_HERO;
    return {
      heroId,
      starFrom: clampIdx(h.starFrom),
      starSaved: Math.max(0, Math.round(Number(h.starSaved) || 0)),
      starTo: clampIdx(h.starTo ?? STAR_MAX_INDEX),
      exFrom: exLabels.includes(h.exFrom ?? '') ? h.exFrom! : exLabels[0],
      exTo: exLabels.includes(h.exTo ?? '') ? h.exTo! : exLabels[exLabels.length - 1]
    };
  }
  function load(): Hero[] {
    const raw = readJson<Hero[]>(STORAGE);
    return Array.isArray(raw) ? raw.map(cleanHero) : [];
  }
  const roster = $state<Hero[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      roster.map((h) => ({ ...h }))
    );

  function addHero() {
    roster.push(cleanHero({ heroId: DEFAULT_HERO, starFrom: 0, starTo: STAR_MAX_INDEX }));
    persist();
  }
  function removeHero(i: number) {
    roster.splice(i, 1);
    persist();
  }

  // Star control works in (star, segment) but stores a linear index.
  const starOf = (idx: number) =>
    Math.floor(Math.min(idx, STAR_MAX_INDEX) / STAR_SEGMENTS_PER_STAR);
  const segOf = (idx: number) => (idx >= STAR_MAX_INDEX ? 0 : idx % STAR_SEGMENTS_PER_STAR);
  const starOptions = Array.from({ length: 6 }, (_, s) => ({ value: String(s), label: `${s}★` }));
  const segOptions = Array.from({ length: STAR_SEGMENTS_PER_STAR }, (_, s) => ({
    value: String(s),
    label: `${s}/6`
  }));
  const tx = $derived(i18n.m.upgrade.heroes as unknown as Record<string, string>);

  // Catalog lookups for a roster row.
  const heroOf = (h: Hero) => heroFromCatalog(h.heroId) ?? HERO_CATALOG[0];
  const rarityOf = (h: Hero) => heroOf(h).rarity;
  const heroName = (h: Hero) => heroOf(h).name;
  // Hero picker options: "Name — Gen 3 · lancer" so the Select's search covers
  // name, generation and troop. Mythics first (by generation), then base pool.
  const heroOptions = $derived(
    [...HERO_CATALOG]
      .sort((a, b) => (a.generation ?? 99) - (b.generation ?? 99) || a.name.localeCompare(b.name))
      .map((c) => {
        const tag = c.generation === null ? tx.base : `${tx.gen} ${c.generation}`;
        const troop = tx['troop' + c.troopType[0].toUpperCase() + c.troopType.slice(1)];
        return { value: c.id, label: `${TROOP_EMOJI[c.troopType]} ${c.name} — ${tag} · ${troop}` };
      })
  );

  function setStarPart(i: number, which: 'From' | 'To', part: 'star' | 'seg', value: number) {
    const key = which === 'From' ? 'starFrom' : 'starTo';
    const cur = roster[i][key];
    const star = part === 'star' ? value : starOf(cur);
    const seg = part === 'seg' ? value : segOf(cur);
    roster[i][key] = starIndex(star, seg);
    persist();
  }

  // Per-hero figures.
  const shardsOf = (h: Hero) => starShardsBetween(h.starFrom, h.starTo, h.starSaved);
  const widgetsOf = (h: Hero) =>
    heroOf(h).hasExclusiveGear
      ? (sumLadder(HERO_EXCLUSIVE, h.exFrom, h.exTo).totals.widget ?? 0)
      : 0;

  // ── Gear pool ─────────────────────────────────────────────────────────────
  // Normal hero gear is shared: pieces level on their own and you swap them
  // between heroes, so it's a pool, separate from the per-hero roster. Each
  // piece carries three stacked tracks: enhancement (XP), mastery (essence +
  // mythic gear) and empowerment (mithril + mythic gear).
  type GearRarity = 'green' | 'blue' | 'purple' | 'mythic' | 'legendary';
  interface Piece {
    pieceId: string;
    troop: TroopType;
    rarity: GearRarity;
    enhFrom: string;
    enhTo: string;
    masFrom: string;
    masTo: string;
    empFrom: string;
    empTo: string;
  }
  const GEAR_TROOPS: TroopType[] = ['infantry', 'lancer', 'marksman'];
  const GEAR_RARITIES: GearRarity[] = ['green', 'blue', 'purple', 'mythic', 'legendary'];
  // Which tracks a rarity unlocks: mastery is Gold/Mythic+, empowerment is Legendary only.
  const hasMastery = (r: GearRarity) => r === 'mythic' || r === 'legendary';
  const hasEmpower = (r: GearRarity) => r === 'legendary';
  const GEAR_STORAGE = 'upgrade-heroes-gear-v2'; // v2: sensible "to = max" defaults
  const enhLabels = HERO_ENHANCE.map((l) => l.label);
  const masLabels = HERO_MASTERY.map((l) => l.label);
  const empLabels = HERO_EMPOWER.map((l) => l.label);
  const inOr = (labels: string[], v: string | undefined, fallback: string) =>
    labels.includes(v ?? '') ? v! : fallback;
  function cleanPiece(p: Partial<Piece>): Piece {
    return {
      pieceId: HERO_GEAR_PIECES.some((g) => g.id === p.pieceId)
        ? p.pieceId!
        : HERO_GEAR_PIECES[0].id,
      troop: GEAR_TROOPS.includes(p.troop as TroopType) ? (p.troop as TroopType) : 'infantry',
      rarity: GEAR_RARITIES.includes(p.rarity as GearRarity) ? (p.rarity as GearRarity) : 'mythic',
      enhFrom: inOr(enhLabels, p.enhFrom, enhLabels[0]),
      enhTo: inOr(enhLabels, p.enhTo, enhLabels[enhLabels.length - 1]),
      masFrom: inOr(masLabels, p.masFrom, masLabels[0]),
      masTo: inOr(masLabels, p.masTo, masLabels[masLabels.length - 1]),
      empFrom: inOr(empLabels, p.empFrom, empLabels[0]),
      empTo: inOr(empLabels, p.empTo, empLabels[empLabels.length - 1])
    };
  }
  const gearPool = $state<Piece[]>(
    (readJson<Piece[]>(GEAR_STORAGE) ?? []).map(cleanPiece) as Piece[]
  );
  const persistGear = () =>
    writeJson(
      GEAR_STORAGE,
      gearPool.map((p) => ({ ...p }))
    );
  function addPiece() {
    gearPool.push(cleanPiece({ pieceId: HERO_GEAR_PIECES[gearPool.length % 4]?.id }));
    persistGear();
  }
  function removePiece(i: number) {
    gearPool.splice(i, 1);
    persistGear();
  }
  const pieceOptions = HERO_GEAR_PIECES.map((g) => ({ value: g.id, label: g.name }));
  const troopOptions = $derived(
    GEAR_TROOPS.map((t) => ({
      value: t,
      label: `${TROOP_EMOJI[t]} ${tx['troop' + t[0].toUpperCase() + t.slice(1)]}`
    }))
  );
  const rarityGearOptions = $derived(
    GEAR_RARITIES.map((r) => ({ value: r, label: tx['tier' + r[0].toUpperCase() + r.slice(1)] }))
  );
  // Sum only the tracks a piece's rarity actually unlocks. A Legendary piece
  // also pays the one-off ascension (2 Mythic Hero Gear) on top of empowerment.
  const gearTotals = $derived.by(() => {
    const parts = gearPool.flatMap((p) => {
      const ladders = [sumLadder(HERO_ENHANCE, p.enhFrom, p.enhTo)];
      if (hasMastery(p.rarity)) ladders.push(sumLadder(HERO_MASTERY, p.masFrom, p.masTo));
      if (hasEmpower(p.rarity)) ladders.push(sumLadder(HERO_EMPOWER, p.empFrom, p.empTo));
      return ladders;
    });
    let total = combine(parts).totals;
    for (const p of gearPool) if (hasEmpower(p.rarity)) total = addBags(total, GEAR_ASCENSION_COST);
    return total;
  });
  const poolRows = $derived(
    presentResources(gearTotals).map((k) => ({ k, n: gearTotals[k] ?? 0 }))
  );

  // ── Power gain ──────────────────────────────────────────────────────────
  // Stat bonuses each gear upgrade grants (community-modelled curves; mastery is
  // a ×(1+0.1·level) multiplier, applied only when the rarity unlocks it).
  const pieceGain = (p: Piece): GearStats =>
    gearStatGain(
      pieceGroup(p.pieceId),
      p.troop as GearTroop,
      Number(p.enhFrom) || 0,
      Number(p.enhTo) || 0,
      hasMastery(p.rarity) ? Number(p.masFrom) || 0 : 0,
      hasMastery(p.rarity) ? Number(p.masTo) || 0 : 0
    );
  const powerTotals = $derived.by(() => {
    const t = { heroAtk: 0, heroDef: 0, heroHp: 0, lethality: 0, troopHealth: 0 };
    for (const p of gearPool) {
      const g = pieceGain(p);
      t.heroAtk += g.heroAtk ?? 0;
      t.heroDef += g.heroDef ?? 0;
      t.heroHp += g.heroHp;
      if (g.commandKind === 'lethality') t.lethality += g.commandPct;
      else t.troopHealth += g.commandPct;
    }
    return t;
  });
  const fmtPct = (n: number) => `${Math.round(n * 100) / 100}%`;
  const powerRows = $derived(
    (
      [
        ['lethality', powerTotals.lethality, true],
        ['troopHealth', powerTotals.troopHealth, true],
        ['heroAtk', powerTotals.heroAtk, false],
        ['heroDef', powerTotals.heroDef, false],
        ['heroHp', powerTotals.heroHp, false]
      ] as [string, number, boolean][]
    )
      .filter(([, n]) => n > 0)
      .map(([k, n, pct]) => ({
        k,
        label: tx['stat' + k[0].toUpperCase() + k.slice(1)],
        v: pct ? fmtPct(n) : `+${formatQty(n)}`
      }))
  );

  // Combined shopping list: shards bucketed by rarity, widgets per hero.
  const shardTotals = $derived.by(() => {
    const t: ResourceBag = {};
    for (const h of roster) {
      const k = SHARD_KEY[rarityOf(h)];
      t[k] = (t[k] ?? 0) + shardsOf(h);
    }
    return t;
  });
  const shardRows = $derived(
    (['mythicShard', 'epicShard', 'rareShard'] as ResourceKey[])
      .map((k) => ({ k, n: shardTotals[k] ?? 0 }))
      .filter((r) => r.n > 0)
  );
  const widgetRows = $derived(
    roster.map((h) => ({ name: heroName(h), n: widgetsOf(h) })).filter((r) => r.n > 0)
  );
  const hasOutput = $derived(shardRows.length > 0 || widgetRows.length > 0 || poolRows.length > 0);
  // Poolable materials for the deficit panel (shards by rarity + gear pool
  // resources). Widgets are hero-specific currencies, so they're left out.
  const heroNeeded = $derived(addBags(shardTotals, gearTotals));

  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const widgetDef = resDef('widget');
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.heroes} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.upgrade.cat.heroes} sub={tx.sub} backHref="/upgrade" />

  <div class="roster">
    {#each roster as h, i (i)}
      {@const cat = heroOf(h)}
      <div class="hero">
        <div class="hero-head">
          <span
            class="rarity-dot rarity-{cat.rarity}"
            title={tx['rarity' + cat.rarity[0].toUpperCase() + cat.rarity.slice(1)]}
          ></span>
          <span
            class="troop"
            title={tx['troop' + cat.troopType[0].toUpperCase() + cat.troopType.slice(1)]}
            >{TROOP_EMOJI[cat.troopType]}</span
          >
          <div class="hero-pick">
            <Select
              value={h.heroId}
              options={heroOptions}
              onChange={(v) => {
                h.heroId = v;
                persist();
              }}
              ariaLabel={tx.pickHero}
            />
          </div>
          <button
            class="hero-remove"
            type="button"
            onclick={() => removeHero(i)}
            aria-label={i18n.m.upgrade.troops.remove}
            title={i18n.m.upgrade.troops.remove}>🗑</button
          >
        </div>

        <div class="field">
          <span class="field-label">⭐ {tx.star}</span>
          <div class="star-grid">
            <div class="star-side">
              <span class="side-tag">{tx.from}</span>
              <Select
                value={String(starOf(h.starFrom))}
                options={starOptions}
                onChange={(v) => setStarPart(i, 'From', 'star', Number(v))}
                ariaLabel="{tx.star} {tx.from}"
              />
              <Select
                value={String(segOf(h.starFrom))}
                options={segOptions}
                onChange={(v) => setStarPart(i, 'From', 'seg', Number(v))}
                ariaLabel="{tx.starSeg} {tx.from}"
              />
            </div>
            <div class="star-side">
              <span class="side-tag">{tx.to}</span>
              <Select
                value={String(starOf(h.starTo))}
                options={starOptions}
                onChange={(v) => setStarPart(i, 'To', 'star', Number(v))}
                ariaLabel="{tx.star} {tx.to}"
              />
              <Select
                value={String(segOf(h.starTo))}
                options={segOptions}
                onChange={(v) => setStarPart(i, 'To', 'seg', Number(v))}
                ariaLabel="{tx.starSeg} {tx.to}"
              />
            </div>
          </div>
          <div class="saved">
            <span class="side-tag">{tx.starSaved}</span>
            <NumberInput
              value={h.starSaved}
              onChange={(n) => {
                h.starSaved = Math.max(0, n);
                persist();
              }}
              ariaLabel={tx.starSaved}
            />
          </div>
          {#if shardsOf(h) > 0}
            <p class="star-out">
              {starLabel(h.starFrom)} → {starLabel(h.starTo)} ·
              <strong>{formatQty(shardsOf(h))}</strong>
              <span class="ic" style="--c: {resDef(SHARD_KEY[cat.rarity]).color}"
                >{resDef(SHARD_KEY[cat.rarity]).icon}</span
              >
              {resName(SHARD_KEY[cat.rarity])}
            </p>
          {/if}
        </div>

        {#if cat.hasExclusiveGear}
          <div class="field">
            <span class="field-label">🔧 {tx.exclusiveGear}</span>
            <div class="ex-grid">
              <Select
                value={h.exFrom}
                options={exLabels.map((l) => ({ value: l, label: l }))}
                onChange={(v) => {
                  h.exFrom = v;
                  persist();
                }}
                ariaLabel="{tx.exclusiveGear} {tx.from}"
              />
              <span class="arrow">→</span>
              <Select
                value={h.exTo}
                options={exLabels.map((l) => ({ value: l, label: l }))}
                onChange={(v) => {
                  h.exTo = v;
                  persist();
                }}
                ariaLabel="{tx.exclusiveGear} {tx.to}"
              />
              {#if widgetsOf(h) > 0}
                <span class="ex-out"
                  ><strong>{formatQty(widgetsOf(h))}</strong>
                  <span class="ic" style="--c: {widgetDef.color}">{widgetDef.icon}</span></span
                >
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/each}

    <button class="add" type="button" onclick={addHero}>+ {tx.addHero}</button>
  </div>

  {#if roster.length === 0}
    <p class="empty">{tx.empty}</p>
  {/if}

  <section class="gear">
    <h2 class="section-label">🛡 {tx.gearPool}</h2>
    <p class="note">{tx.gearNote}</p>
    {#each gearPool as p, i (i)}
      {@const g = pieceGain(p)}
      <div class="piece">
        <div class="piece-head">
          <span class="tier tier-{p.rarity}"
            >{tx['tier' + p.rarity[0].toUpperCase() + p.rarity.slice(1)]}</span
          >
          <div class="piece-selects">
            <Select
              value={p.pieceId}
              options={pieceOptions}
              onChange={(v) => {
                p.pieceId = v;
                persistGear();
              }}
              ariaLabel={tx.gearPool}
            />
            <Select
              value={p.troop}
              options={troopOptions}
              onChange={(v) => {
                p.troop = v as TroopType;
                persistGear();
              }}
              ariaLabel={tx.troop}
            />
            <Select
              value={p.rarity}
              options={rarityGearOptions}
              onChange={(v) => {
                p.rarity = v as GearRarity;
                persistGear();
              }}
              ariaLabel={tx.rarity}
            />
          </div>
          <button
            class="hero-remove"
            type="button"
            onclick={() => removePiece(i)}
            aria-label={i18n.m.upgrade.troops.remove}
            title={i18n.m.upgrade.troops.remove}>🗑</button
          >
        </div>
        <div class="track">
          <span class="side-tag">{tx.enhance}</span>
          <RangeSelect
            labels={enhLabels}
            from={p.enhFrom}
            to={p.enhTo}
            onChange={(f, t) => {
              p.enhFrom = f;
              p.enhTo = t;
              persistGear();
            }}
            ariaFrom="{tx.enhance} {tx.from}"
            ariaTo="{tx.enhance} {tx.to}"
          />
        </div>
        {#if hasMastery(p.rarity)}
          <div class="track">
            <span class="side-tag">{tx.mastery}</span>
            <RangeSelect
              labels={masLabels}
              from={p.masFrom}
              to={p.masTo}
              onChange={(f, t) => {
                p.masFrom = f;
                p.masTo = t;
                persistGear();
              }}
              ariaFrom="{tx.mastery} {tx.from}"
              ariaTo="{tx.mastery} {tx.to}"
            />
          </div>
        {/if}
        {#if hasEmpower(p.rarity)}
          <div class="track">
            <span class="side-tag">{tx.empower}</span>
            <RangeSelect
              labels={empLabels}
              from={p.empFrom}
              to={p.empTo}
              onChange={(f, t) => {
                p.empFrom = f;
                p.empTo = t;
                persistGear();
              }}
              ariaFrom="{tx.empower} {tx.from}"
              ariaTo="{tx.empower} {tx.to}"
            />
          </div>
        {/if}
        {#if g.commandPct > 0 || (g.heroAtk ?? 0) > 0 || (g.heroDef ?? 0) > 0 || g.heroHp > 0}
          <p class="gain">
            📈
            {#if g.commandPct > 0}<span class="g-pct"
                >+{fmtPct(g.commandPct)}
                {g.commandKind === 'lethality' ? tx.statLethality : tx.statTroopHealth}</span
              >{/if}
            {#if (g.heroAtk ?? 0) > 0}<span>+{formatQty(g.heroAtk ?? 0)} {tx.statHeroAtk}</span
              >{/if}
            {#if (g.heroDef ?? 0) > 0}<span>+{formatQty(g.heroDef ?? 0)} {tx.statHeroDef}</span
              >{/if}
            {#if g.heroHp > 0}<span>+{formatQty(g.heroHp)} {tx.statHeroHp}</span>{/if}
          </p>
        {/if}
      </div>
    {/each}
    <button class="add" type="button" onclick={addPiece}>+ {tx.addPiece}</button>
  </section>

  {#if powerRows.length > 0}
    <section class="shopping">
      <h2 class="section-label">📈 {tx.powerGain}</h2>
      {#each powerRows as row (row.k)}
        <div class="res">
          <span class="res-name">{row.label}</span>
          <span class="res-val sm">{row.v}</span>
        </div>
      {/each}
      <p class="note">{tx.powerNote}</p>
    </section>
  {/if}

  {#if hasOutput}
    <section class="shopping">
      <h2 class="section-label">🛒 {tx.shopping}</h2>
      {#each shardRows as row (row.k)}
        <div class="res">
          <span class="res-icon" style="--c: {resDef(row.k).color}">{resDef(row.k).icon}</span>
          <span class="res-name">{resName(row.k)}</span>
          <span class="res-val">{formatQty(row.n)}</span>
        </div>
      {/each}
      {#if widgetRows.length > 0}
        <div class="res res-group">
          <span class="res-icon" style="--c: {widgetDef.color}">{widgetDef.icon}</span>
          <span class="res-name">{resName('widget')} <em>({tx.perHero})</em></span>
        </div>
        {#each widgetRows as row (row.name)}
          <div class="res res-sub">
            <span class="res-name">{row.name}</span>
            <span class="res-val sm">{formatQty(row.n)}</span>
          </div>
        {/each}
      {/if}
      {#each poolRows as row (row.k)}
        <div class="res">
          <span class="res-icon" style="--c: {resDef(row.k).color}">{resDef(row.k).icon}</span>
          <span class="res-name">{resName(row.k)}</span>
          <span class="res-val">{formatQty(row.n)}</span>
        </div>
      {/each}
    </section>
  {/if}

  <DeficitPanel needed={heroNeeded} />
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .roster {
    display: grid;
    gap: 14px;
  }
  .hero {
    display: grid;
    gap: 14px;
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .hero-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hero-pick {
    flex: 1;
    min-width: 0;
  }
  .troop {
    flex-shrink: 0;
    font-size: 15px;
    line-height: 1;
  }
  .rarity-dot {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--text-dim);
  }
  .rarity-mythic {
    background: #fb7185;
    box-shadow: 0 0 7px #fb718577;
  }
  .rarity-epic {
    background: #c084fc;
    box-shadow: 0 0 7px #c084fc77;
  }
  .rarity-rare {
    background: #60a5fa;
    box-shadow: 0 0 7px #60a5fa77;
  }
  .hero-remove {
    flex-shrink: 0;
    background: transparent;
    border: none;
    padding: 4px 6px;
    font-size: 16px;
    line-height: 1;
    opacity: 0.55;
    cursor: pointer;
  }
  .hero-remove:hover {
    opacity: 1;
  }
  .field {
    display: grid;
    gap: 8px;
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .star-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .star-side {
    display: grid;
    grid-template-columns: auto 1fr 1fr;
    align-items: center;
    gap: 6px;
  }
  .side-tag {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .saved {
    display: grid;
    grid-template-columns: auto 120px;
    align-items: center;
    gap: 8px;
  }
  .star-out,
  .ex-out {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .star-out {
    margin: 2px 0 0;
  }
  .star-out strong,
  .ex-out strong {
    color: var(--text);
  }
  .ex-grid {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ex-grid :global(.select) {
    flex: 1;
  }
  .arrow {
    color: var(--text-dim);
  }
  .ex-out {
    margin-inline-start: 4px;
    white-space: nowrap;
  }
  .ic {
    filter: drop-shadow(0 0 5px color-mix(in srgb, var(--c) 40%, transparent));
  }
  .add {
    justify-self: start;
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 14px;
    cursor: pointer;
    margin-top: 4px;
  }
  .add:hover {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .empty {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-dim);
    text-align: center;
    margin: 24px 0;
  }
  .gear {
    margin-top: 28px;
    display: grid;
    gap: 12px;
  }
  .note {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
    margin: 0;
  }
  .piece {
    display: grid;
    gap: 10px;
    padding: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .piece-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .piece-selects {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }
  .tier {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 3px 7px;
    border-radius: var(--r-pill);
  }
  .tier-green {
    color: #4ade80;
    background: #4ade8022;
    border: 1px solid #4ade8055;
  }
  .tier-blue {
    color: #60a5fa;
    background: #60a5fa22;
    border: 1px solid #60a5fa55;
  }
  .tier-purple {
    color: #c084fc;
    background: #c084fc22;
    border: 1px solid #c084fc55;
  }
  .tier-mythic {
    color: #fbbf24;
    background: #fbbf2422;
    border: 1px solid #fbbf2455;
  }
  .tier-legendary {
    color: #fb7185;
    background: #fb718522;
    border: 1px solid #fb718555;
  }
  .track {
    display: grid;
    grid-template-columns: 70px 1fr;
    align-items: center;
    gap: 8px;
  }
  .gain {
    margin: 2px 0 0;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--text-mid);
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
  }
  .gain .g-pct {
    color: #4ade80;
    font-weight: 700;
  }
  .shopping {
    margin-top: 28px;
    display: grid;
    gap: 10px;
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
    margin: 8px 0 4px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
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
  .res-name em {
    color: var(--text-dim);
    font-style: normal;
    font-size: 11px;
  }
  .res-val {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 22px;
    letter-spacing: -0.01em;
  }
  .res-val.sm {
    font-size: 16px;
  }
  .res-group {
    padding-bottom: 8px;
    border-bottom: none;
    background: transparent;
    border: none;
    padding: 8px 18px 2px;
  }
  .res-sub {
    background: transparent;
    border: none;
    padding: 4px 18px 4px 52px;
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
    .star-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
