<script lang="ts">
  /**
   * Event calendar — projects recurring WOS events from the server age (and an
   * optional real SvS date to lock the 28-day cycle). Times shown in UTC + the
   * viewer's local time; cyclic/uncertain events carry an honesty badge.
   */
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import {
    projectEvents,
    lockedEvents,
    seasonalNext,
    DAY_MS,
    type Occurrence
  } from '$lib/tools/events/events';
  import { readJson, writeJson } from '$lib/utils/storage';

  const AGE_KEY = 'events-server-age-v1';
  const SVS_KEY = 'events-svs-date-v1';
  const VIEW_KEY = 'events-view-v1';
  let serverAge = $state(Math.max(0, readJson<number>(AGE_KEY) ?? 100));
  let svsDate = $state(readJson<string>(SVS_KEY) ?? ''); // 'YYYY-MM-DD'
  let view = $state<'list' | 'calendar'>(readJson<'list' | 'calendar'>(VIEW_KEY) ?? 'list');
  const now = Date.now();

  function setAge(n: number) {
    serverAge = Math.max(0, Math.round(n) || 0);
    writeJson(AGE_KEY, serverAge);
  }
  function setSvs(v: string) {
    svsDate = v;
    writeJson(SVS_KEY, v);
  }
  function setView(v: string) {
    view = v as 'list' | 'calendar';
    writeJson(VIEW_KEY, view);
  }

  const tx = $derived(i18n.m.events as unknown as Record<string, string>);
  const eventName = (id: string) => (i18n.m.events.names as Record<string, string>)[id] ?? id;
  const CAT_COLOR: Record<string, string> = {
    pvp: '#fb7185',
    alliance: '#60a5fa',
    growth: '#4ade80',
    seasonal: '#fbbf24'
  };

  const svsDateMs = $derived(svsDate ? Date.parse(`${svsDate}T10:00:00Z`) : undefined);
  const items = $derived(
    projectEvents({ nowMs: now, horizonDays: 35, serverAgeDays: serverAge, svsDateMs })
  );
  const locked = $derived(lockedEvents({ nowMs: now, serverAgeDays: serverAge }));
  const seasonal = seasonalNext(now);

  // Group occurrences under local-day headers (items are already sorted).
  const groups = $derived.by(() => {
    const out: { key: string; dayMs: number; items: Occurrence[] }[] = [];
    for (const it of items) {
      const d = new Date(it.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      let g = out[out.length - 1];
      if (!g || g.key !== key) {
        g = { key, dayMs: it.start, items: [] };
        out.push(g);
      }
      g.items.push(it);
    }
    return out;
  });

  // ── Calendar (month grid) ──
  const dayKeyOf = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };
  const byDay = $derived.by(() => {
    const m = new Map<string, Occurrence[]>();
    for (const it of items) {
      const k = dayKeyOf(it.start);
      const arr = m.get(k);
      if (arr) arr.push(it);
      else m.set(k, [it]);
    }
    return m;
  });
  // 6-week grid starting on the Monday of the current week (DST-safe day stepping).
  const gridDays = $derived.by(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
    const out: number[] = [];
    for (let i = 0; i < 42; i++) {
      out.push(d.getTime());
      d.setDate(d.getDate() + 1);
    }
    return out;
  });
  const weekdayLabels = $derived(
    gridDays
      .slice(0, 7)
      .map((ms) => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(ms)))
  );
  const startOfToday = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  let selectedDay = $state(startOfToday); // midnight-local ms
  const selectedItems = $derived(byDay.get(dayKeyOf(selectedDay)) ?? []);
  const todayKey = dayKeyOf(now);

  const pad = (n: number) => String(n).padStart(2, '0');
  const utcTime = (ms: number) => {
    const d = new Date(ms);
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };
  const localTime = (ms: number) => {
    const d = new Date(ms);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const dayLabel = (ms: number) =>
    new Intl.DateTimeFormat(undefined, { weekday: 'short', day: '2-digit', month: 'short' }).format(
      new Date(ms)
    );
  const dateLabel = (ms: number) =>
    new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(new Date(ms));

  function relative(o: Occurrence): string {
    if (o.start <= now && now <= o.end) return tx.ongoing;
    const diff = o.start - now;
    const d = Math.floor(diff / DAY_MS);
    const h = Math.floor((diff % DAY_MS) / 3_600_000);
    const span = d > 0 ? `${d}d ${h}h` : `${h}h`;
    return `${tx.in} ${span}`;
  }
  const unlockIn = (unlockMs: number) =>
    `${tx.unlocksIn} ${Math.ceil((unlockMs - now) / DAY_MS)}${tx.days}`;

  // Cadence = day known but in-game hour unconfirmed; estimate = cyclic date not
  // yet pinned to a real SvS. Show the stronger caveat.
  const badge = (o: Occurrence) =>
    o.def.tier === 'seasonal'
      ? tx.tierSeasonal
      : o.def.tier === 'cadence'
        ? tx.tierCadence
        : o.estimate
          ? tx.tierEstimate
          : null;
  const dateRange = (start: number, end: number) =>
    `${dateLabel(start)} – ${dateLabel(end - DAY_MS)}`;
</script>

<svelte:head>
  <title>{tx.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

{#snippet eventRow(o: Occurrence)}
  {@const b = badge(o)}
  <div class="ev">
    <span class="dot" style="--c: {CAT_COLOR[o.def.category]}"></span>
    <div class="ev-body">
      <span class="ev-name"
        >{eventName(o.def.id)}{#if o.theme}<span class="theme"
            >· {(i18n.m.events.themes as Record<string, string>)[o.theme]}</span
          >{/if}</span
      >
      <span class="ev-time">
        {utcTime(o.start)}
        {tx.utc} · {localTime(o.start)}
        {tx.local}
        {#if b}<span class="tag" class:cadence={o.def.tier === 'cadence'}>{b}</span>{/if}
      </span>
    </div>
    <span class="ev-rel" class:now={o.start <= now && now <= o.end}>{relative(o)}</span>
  </div>
{/snippet}

<div class="wrap">
  <PageHeader title={tx.title} sub={tx.sub} backHref="/" />

  <div class="controls">
    <label class="field">
      <span class="field-label">{tx.serverAge}</span>
      <NumberInput value={serverAge} onChange={setAge} ariaLabel={tx.serverAge} />
      <span class="hint">{tx.serverAgeHelp}</span>
    </label>
    <label class="field">
      <span class="field-label">{tx.svsDate}</span>
      <span class="date-row">
        <input
          class="date-in"
          type="date"
          value={svsDate}
          oninput={(e) => setSvs(e.currentTarget.value)}
          aria-label={tx.svsDate}
        />
        {#if svsDate}<button class="clear" type="button" onclick={() => setSvs('')}
            >{tx.svsDateClear}</button
          >{/if}
      </span>
      <span class="hint">{tx.svsDateHelp}</span>
    </label>
  </div>

  <div class="toolbar">
    <Segmented
      value={view}
      ariaLabel={tx.view}
      options={[
        { value: 'list', label: tx.viewList },
        { value: 'calendar', label: tx.viewCalendar }
      ]}
      onChange={setView}
    />
  </div>

  <div class="legend">
    <span class="leg"><span class="tag">{tx.tierEstimate}</span></span>
    <span class="leg"><span class="tag cadence">{tx.tierCadence}</span></span>
    <span class="leg"><span class="dot reliable"></span>{tx.legendReliable}</span>
    <span class="leg"><span class="dot" style="--c: {CAT_COLOR.pvp}"></span>{tx.catPvp}</span>
    <span class="leg"
      ><span class="dot" style="--c: {CAT_COLOR.alliance}"></span>{tx.catAlliance}</span
    >
    <span class="leg"><span class="dot" style="--c: {CAT_COLOR.growth}"></span>{tx.catGrowth}</span>
    <span class="leg"
      ><span class="dot" style="--c: {CAT_COLOR.seasonal}"></span>{tx.catSeasonal}</span
    >
  </div>

  {#if view === 'list'}
    {#if groups.length === 0}
      <p class="empty">{tx.empty}</p>
    {/if}
    {#each groups as g (g.key)}
      <div class="day">
        <h2 class="day-head">{dayLabel(g.dayMs)}</h2>
        {#each g.items as o (o.def.id + o.start)}{@render eventRow(o)}{/each}
      </div>
    {/each}
  {:else}
    <div class="cal-grid cal-head">
      {#each weekdayLabels as w (w)}<span class="cal-wd">{w}</span>{/each}
    </div>
    <div class="cal-grid">
      {#each gridDays as ms (ms)}
        {@const key = dayKeyOf(ms)}
        {@const evs = byDay.get(key) ?? []}
        <button
          type="button"
          class="cal-cell"
          class:today={key === todayKey}
          class:selected={ms === selectedDay}
          class:past={ms < startOfToday}
          onclick={() => (selectedDay = ms)}
        >
          <span class="cal-num">{new Date(ms).getDate()}</span>
          <span class="cal-dots">
            {#each evs.slice(0, 4) as o (o.def.id + o.start)}
              <span class="cal-dot" style="--c: {CAT_COLOR[o.def.category]}"></span>
            {/each}
            {#if evs.length > 4}<span class="cal-more">+{evs.length - 4}</span>{/if}
          </span>
        </button>
      {/each}
    </div>
    <div class="cal-detail">
      <h2 class="day-head">{dayLabel(selectedDay)}</h2>
      {#if selectedItems.length > 0}
        {#each selectedItems as o (o.def.id + o.start)}{@render eventRow(o)}{/each}
      {:else}
        <p class="empty">{tx.noDay}</p>
      {/if}
    </div>
  {/if}

  {#if locked.length > 0}
    <section class="locked">
      <h2 class="section-label">🔒 {tx.lockedTitle}</h2>
      {#each locked as l (l.def.id)}
        <div class="ev">
          <span class="dot" style="--c: {CAT_COLOR[l.def.category]}"></span>
          <div class="ev-body"><span class="ev-name">{eventName(l.def.id)}</span></div>
          <span class="ev-rel">{unlockIn(l.unlockMs)} · {dateLabel(l.unlockMs)}</span>
        </div>
      {/each}
    </section>
  {/if}

  {#if seasonal.length > 0}
    <section class="locked">
      <h2 class="section-label">🎉 {tx.seasonalTitle}</h2>
      {#each seasonal as s (s.def.id)}
        <div class="ev">
          <span class="dot" style="--c: {CAT_COLOR.seasonal}"></span>
          <div class="ev-body">
            <span class="ev-name">{eventName(s.def.id)}</span>
            <span class="ev-time"
              >{dateRange(s.start, s.end)} <span class="tag">{tx.tierSeasonal}</span></span
            >
          </div>
          <span class="ev-rel"
            >{relative({ def: s.def, start: s.start, end: s.end, estimate: false })}</span
          >
        </div>
      {/each}
    </section>
  {/if}

  <p class="note">{tx.note}</p>
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 24px;
  }
  .field {
    display: grid;
    gap: 6px;
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .hint {
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.5;
    color: var(--text-dim);
  }
  .date-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .date-in {
    flex: 1;
    min-width: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 9px 12px;
  }
  .date-in:focus {
    outline: none;
    border-color: var(--border-accent);
  }
  .clear {
    flex-shrink: 0;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 6px 10px;
    cursor: pointer;
  }
  .toolbar {
    margin-bottom: 12px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-bottom: 20px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
  }
  .leg {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .dot.reliable {
    background: var(--text-mid);
    box-shadow: none;
  }
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .cal-head {
    margin-bottom: 4px;
  }
  .cal-wd {
    text-align: center;
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-dim);
    padding-bottom: 2px;
  }
  .cal-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 3px;
    padding: 4px 2px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    color: var(--text);
    overflow: hidden;
  }
  .cal-cell.past {
    opacity: 0.4;
  }
  .cal-cell.today {
    border-color: var(--border-accent);
  }
  .cal-cell.selected {
    background: var(--accent-glow);
    border-color: var(--accent);
  }
  .cal-num {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1;
  }
  .cal-dots {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .cal-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--c);
  }
  .cal-more {
    font-family: var(--font-mono);
    font-size: 8px;
    color: var(--text-dim);
  }
  .cal-detail {
    margin-top: 18px;
  }
  .day {
    margin-bottom: 18px;
  }
  .day-head {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-mid);
    margin: 0 0 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }
  .ev {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 4px;
  }
  .dot {
    flex-shrink: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--c);
    box-shadow: 0 0 7px color-mix(in srgb, var(--c) 60%, transparent);
  }
  .ev-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ev-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 15px;
  }
  .theme {
    margin-inline-start: 6px;
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 12px;
    color: #4ade80;
  }
  .ev-time {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .tag {
    color: #fbbf24;
    border: 1px solid #fbbf2455;
    border-radius: var(--r-pill);
    padding: 1px 6px;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .tag.cadence {
    color: #93d4ff;
    border-color: #93d4ff55;
  }
  .ev-rel {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
    text-align: end;
  }
  .ev-rel.now {
    color: #4ade80;
    font-weight: 700;
  }
  .locked {
    margin-top: 24px;
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
    margin: 8px 0 10px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .empty {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-dim);
    text-align: center;
    margin: 24px 0;
  }
  .note {
    margin: 24px 0 0;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
    .controls {
      grid-template-columns: 1fr;
    }
  }
</style>
