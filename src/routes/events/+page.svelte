<script lang="ts">
  /**
   * Event calendar — projects recurring WOS events from the server age (and an
   * optional real SvS date to lock the 28-day cycle). Times shown in UTC + the
   * viewer's local time; cyclic/uncertain events carry an honesty badge.
   */
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import Select from '$lib/components/Select.svelte';
  import {
    projectEvents,
    lockedEvents,
    seasonalNext,
    estimateStateAgeDays,
    estimateStateOpenMs,
    DAY_MS,
    type Occurrence
  } from '$lib/tools/events/events';
  import { readJson, writeJson } from '$lib/utils/storage';

  const AGE_KEY = 'events-server-age-v1';
  const SVS_KEY = 'events-svs-date-v1';
  const NUM_KEY = 'events-server-num-v1';
  const VIEW_KEY = 'events-view-v1';
  const initServer = Math.max(0, readJson<number>(NUM_KEY) ?? 0);
  let serverNumber = $state(initServer);
  let serverInput = $state(initServer > 0 ? String(initServer) : '');
  let serverAge = $state(Math.max(0, readJson<number>(AGE_KEY) ?? 100));
  let svsDate = $state(readJson<string>(SVS_KEY) ?? ''); // 'YYYY-MM-DD'
  let view = $state<'list' | 'calendar'>(readJson<'list' | 'calendar'>(VIEW_KEY) ?? 'list');
  const SEASONAL_KEY = 'events-seasonal-open-v1';
  let seasonalOpen = $state(readJson<boolean>(SEASONAL_KEY) ?? false);
  const toggleSeasonal = () => writeJson(SEASONAL_KEY, (seasonalOpen = !seasonalOpen));
  // Prerendered HTML bakes in build-time; refresh to the client's real clock on mount.
  let now = $state(Date.now());
  onMount(() => {
    now = Date.now();
  });

  function setAge(n: number) {
    serverAge = Math.max(0, Math.round(n) || 0);
    writeJson(AGE_KEY, serverAge);
  }
  // Typing a state number auto-estimates the age (debounced); age stays editable.
  let serverTimer: ReturnType<typeof setTimeout> | undefined;
  function onServerInput(v: string) {
    serverInput = v;
    clearTimeout(serverTimer);
    serverTimer = setTimeout(() => {
      const n = Math.max(0, parseInt(v.replace(/\D/g, ''), 10) || 0);
      serverNumber = n;
      writeJson(NUM_KEY, n);
      if (n > 0) setAge(estimateStateAgeDays(n, now));
    }, 400);
  }
  const serverOpenHint = $derived(
    serverNumber > 0 ? `${tx.opened} ${dateLabel(estimateStateOpenMs(serverNumber))}` : ''
  );
  function setSvs(v: string) {
    svsDate = v;
    writeJson(SVS_KEY, v);
  }
  function setView(v: string) {
    view = v as 'list' | 'calendar';
    writeJson(VIEW_KEY, view);
  }

  // ── Custom user markers (e.g. "R5 rotation") ──
  type Repeat = 'none' | 'weekly' | 'monthly';
  interface CustomMarker {
    id: string;
    label: string;
    date: string; // 'YYYY-MM-DD'
    repeat: Repeat;
  }
  const CUSTOM_KEY = 'events-custom-v1';
  let customMarkers = $state<CustomMarker[]>(readJson<CustomMarker[]>(CUSTOM_KEY) ?? []);
  const persistCustom = () =>
    writeJson(
      CUSTOM_KEY,
      customMarkers.map((m) => ({ ...m }))
    );
  let cLabel = $state('');
  let cDate = $state('');
  let cRepeat = $state<Repeat>('none');
  function addCustom() {
    if (!cLabel.trim() || !cDate) return;
    const id = crypto.randomUUID?.() ?? `c${Date.now()}`;
    customMarkers.push({ id, label: cLabel.trim(), date: cDate, repeat: cRepeat });
    persistCustom();
    cLabel = '';
  }
  function removeCustom(id: string) {
    customMarkers = customMarkers.filter((m) => m.id !== id);
    persistCustom();
  }

  const tx = $derived(i18n.m.events as unknown as Record<string, string>);
  const eventName = (id: string) => (i18n.m.events.names as Record<string, string>)[id] ?? id;
  const themeName = (k: string) => (i18n.m.events.themes as Record<string, string>)[k] ?? k;
  const displayName = (o: Occurrence) => o.label ?? eventName(o.def.id);
  /** Compact label for a calendar cell chip (theme for prep days). */
  const chipText = (o: Occurrence) => (o.theme ? themeName(o.theme) : displayName(o));
  const CAT_COLOR: Record<string, string> = {
    pvp: '#fb7185',
    alliance: '#60a5fa',
    growth: '#4ade80',
    seasonal: '#fbbf24',
    custom: '#a78bfa'
  };

  const svsDateMs = $derived(svsDate ? Date.parse(`${svsDate}T10:00:00Z`) : undefined);
  const items = $derived(
    projectEvents({ nowMs: now, horizonDays: 35, serverAgeDays: serverAge, svsDateMs })
  );
  const locked = $derived(lockedEvents({ nowMs: now, serverAgeDays: serverAge }));
  const seasonal = $derived(seasonalNext(now));

  // Everything is keyed by UTC day — events are defined in UTC, so a 00:00 UTC
  // event lands on its UTC date (no off-by-one for non-UTC viewers). Local time
  // is still shown per row as a secondary hint.
  const dayKeyOf = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  };
  const startOfToday = $derived(Math.floor(now / DAY_MS) * DAY_MS); // UTC midnight
  // 6-week grid from the Sunday of the current UTC week (UTC → DST-safe stepping).
  const gridDays = $derived.by(() => {
    const today = Math.floor(now / DAY_MS) * DAY_MS;
    const start = today - new Date(today).getUTCDay() * DAY_MS; // back to Sunday (UTC day 0)
    return Array.from({ length: 42 }, (_, i) => start + i * DAY_MS);
  });
  const weekdayLabels = $derived(
    gridDays
      .slice(0, 7)
      .map((ms) =>
        new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' }).format(
          new Date(ms)
        )
      )
  );

  // Expand custom markers into all-day occurrences across the visible grid range.
  const customItems = $derived.by(() => {
    const out: Occurrence[] = [];
    const from = gridDays[0];
    const to = gridDays[gridDays.length - 1] + DAY_MS;
    const step = (d: Date, r: Repeat) =>
      r === 'monthly' ? d.setUTCMonth(d.getUTCMonth() + 1) : d.setUTCDate(d.getUTCDate() + 7);
    for (const m of customMarkers) {
      const [y, mo, dd] = m.date.split('-').map(Number);
      if (!y) continue;
      const cur = new Date(Date.UTC(y, mo - 1, dd));
      let guard = 0;
      while (m.repeat !== 'none' && cur.getTime() < from && guard++ < 600) step(cur, m.repeat);
      for (guard = 0; guard < 600; guard++) {
        const start = cur.getTime();
        if (start > to) break;
        if (start + DAY_MS >= from)
          out.push({
            def: {
              id: `custom:${m.id}`,
              category: 'custom',
              tier: 'deterministic',
              durationHours: 24
            } as unknown as Occurrence['def'],
            start,
            end: start + DAY_MS,
            estimate: false,
            label: m.label
          });
        if (m.repeat === 'none') break;
        step(cur, m.repeat);
      }
    }
    return out;
  });
  const allItems = $derived([...items, ...customItems].sort((a, b) => a.start - b.start));

  // Group occurrences under local-day headers.
  const groups = $derived.by(() => {
    const out: { key: string; dayMs: number; items: Occurrence[] }[] = [];
    for (const it of allItems) {
      const key = dayKeyOf(it.start);
      let g = out[out.length - 1];
      if (!g || g.key !== key) {
        g = { key, dayMs: it.start, items: [] };
        out.push(g);
      }
      g.items.push(it);
    }
    return out;
  });
  const byDay = $derived.by(() => {
    const m = new Map<string, Occurrence[]>();
    for (const it of allItems) {
      const k = dayKeyOf(it.start);
      const arr = m.get(k);
      if (arr) arr.push(it);
      else m.set(k, [it]);
    }
    return m;
  });

  let selectedDay = $state(Math.floor(Date.now() / DAY_MS) * DAY_MS); // UTC midnight
  onMount(() => (selectedDay = startOfToday));
  const selectedItems = $derived(byDay.get(dayKeyOf(selectedDay)) ?? []);
  const todayKey = $derived(dayKeyOf(now));

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
    new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC'
    }).format(new Date(ms));
  const dateLabel = (ms: number) =>
    new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(
      new Date(ms)
    );

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
        >{displayName(o)}{#if o.theme}<span class="theme">· {themeName(o.theme)}</span>{/if}</span
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
      <span class="field-label">{tx.serverNumber}</span>
      <input
        class="date-in"
        type="text"
        inputmode="numeric"
        value={serverInput}
        oninput={(e) => onServerInput(e.currentTarget.value)}
        aria-label={tx.serverNumber}
      />
      <span class="hint">{serverOpenHint || tx.serverNumberHelp}</span>
    </label>
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
    <span class="leg"><span class="dot" style="--c: {CAT_COLOR.custom}"></span>{tx.catCustom}</span>
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
          <span class="cal-num">{new Date(ms).getUTCDate()}</span>
          <span class="cal-chips">
            {#each evs.slice(0, 2) as o (o.def.id + o.start)}
              <span class="cal-chip" style="--c: {CAT_COLOR[o.def.category]}">{chipText(o)}</span>
            {/each}
            {#if evs.length > 2}<span class="cal-more">+{evs.length - 2}</span>{/if}
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
      <button
        class="section-label section-toggle"
        type="button"
        aria-expanded={seasonalOpen}
        onclick={toggleSeasonal}
      >
        <span class="caret" class:open={seasonalOpen}>▸</span>
        🎉 {tx.seasonalTitle}
        <span class="count">{seasonal.length}</span>
      </button>
      {#if seasonalOpen}
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
      {/if}
    </section>
  {/if}

  <section class="custom">
    <h2 class="section-label">✏️ {tx.customTitle}</h2>
    <div class="custom-form">
      <input
        class="date-in"
        type="text"
        placeholder={tx.customLabel}
        value={cLabel}
        oninput={(e) => (cLabel = e.currentTarget.value)}
        aria-label={tx.customLabel}
      />
      <div class="custom-row">
        <input
          class="date-in"
          type="date"
          value={cDate}
          oninput={(e) => (cDate = e.currentTarget.value)}
          aria-label={tx.customTitle}
        />
        <div class="rep">
          <Select
            value={cRepeat}
            ariaLabel={tx.customRepeat}
            options={[
              { value: 'none', label: tx.repNone },
              { value: 'weekly', label: tx.repWeekly },
              { value: 'monthly', label: tx.repMonthly }
            ]}
            onChange={(v) => (cRepeat = v as Repeat)}
          />
        </div>
        <button
          class="add-btn"
          type="button"
          onclick={addCustom}
          disabled={!cLabel.trim() || !cDate}>{tx.customAdd}</button
        >
      </div>
    </div>
    {#each customMarkers as m (m.id)}
      <div class="ev">
        <span class="dot" style="--c: {CAT_COLOR.custom}"></span>
        <div class="ev-body">
          <span class="ev-name">{m.label}</span>
          <span class="ev-time"
            >{dateLabel(Date.parse(`${m.date}T00:00:00Z`))}
            {#if m.repeat !== 'none'}<span class="tag custom-tag"
                >{m.repeat === 'weekly' ? tx.repWeekly : tx.repMonthly}</span
              >{/if}</span
          >
        </div>
        <button
          class="clear"
          type="button"
          onclick={() => removeCustom(m.id)}
          aria-label={i18n.m.upgrade.troops.remove}>🗑</button
        >
      </div>
    {/each}
  </section>

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
    min-height: 62px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 4px 3px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    color: var(--text);
    overflow: hidden;
    text-align: start;
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
    align-self: flex-end;
  }
  .cal-chips {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .cal-chip {
    font-family: var(--font-mono);
    font-size: 8.5px;
    line-height: 1.3;
    padding: 1px 3px;
    border-radius: 3px;
    border-inline-start: 2px solid var(--c);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cal-more {
    font-family: var(--font-mono);
    font-size: 8px;
    color: var(--text-dim);
    padding-inline-start: 3px;
  }
  .custom {
    margin-top: 24px;
  }
  .custom-form {
    display: grid;
    gap: 8px;
    margin-bottom: 12px;
  }
  .custom-row {
    display: flex;
    gap: 8px;
  }
  .rep {
    flex: 0 0 7.5rem;
    min-width: 0;
  }
  .add-btn {
    flex-shrink: 0;
    background: var(--accent-glow);
    border: 1px solid var(--border-accent);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 0 16px;
    cursor: pointer;
  }
  .add-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .custom-tag {
    color: #a78bfa;
    border-color: #a78bfa55;
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
  .section-toggle {
    width: 100%;
    background: transparent;
    border: 0;
    cursor: pointer;
    padding: 0;
  }
  .caret {
    display: inline-block;
    transition: transform 0.15s ease;
    color: var(--text-dim);
  }
  .caret.open {
    transform: rotate(90deg);
  }
  .count {
    color: var(--text-dim);
    font-size: 10px;
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
