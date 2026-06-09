<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Tutorial from '$lib/components/Tutorial.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { snackbar } from '$lib/stores/snackbar.svelte';
  import { attachDrag } from '$lib/utils/drag';
  import { clamp, formatTime, formatTimeAmPm, formatOffset, mod } from '$lib/utils/format';
  import { copyText } from '$lib/utils/copy';
  import { tz, type Zone } from '$lib/tools/tz/store.svelte';
  import { CATALOG } from '$lib/tools/tz/catalog';
  import {
    nowUtcMinutes,
    offsetMinutes,
    dayOffsetFor,
    matchesOffsetQuery
  } from '$lib/tools/tz/time';
  import { TZ_SLIDES } from '$lib/tools/tz/tutorial';
  import { i18n } from '$lib/i18n/index.svelte';
  import '$lib/tools/tz/tutorial.css';

  let pickerOpen = $state(false);
  let pickerSearch = $state('');
  let tourOpen = $state(false);
  let trackEl = $state<HTMLElement | null>(null);

  const sortedZones = $derived(tz.sortedZones());

  const filteredCatalog = $derived.by(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((c) => {
      const off = offsetMinutes(c.iana);
      return (
        c.name.toLowerCase().includes(q) ||
        c.loc.toLowerCase().includes(q) ||
        c.iana.toLowerCase().includes(q) ||
        formatOffset(off).toLowerCase().includes(q) ||
        matchesOffsetQuery(off, q)
      );
    });
  });

  let liveTimer: ReturnType<typeof setInterval> | null = null;
  let dstTimer: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    if (!tz.hasSeenTour()) tourOpen = true;
    // Live tick every 15s — no-op when manual.
    liveTimer = setInterval(() => {
      if (!tz.isManual) tz.setBaseUtcMin(nowUtcMinutes());
    }, 15_000);
    // Hourly DST resync.
    dstTimer = setInterval(() => tz.resyncOffsets(), 60 * 60 * 1000);
  });

  onDestroy(() => {
    if (liveTimer) clearInterval(liveTimer);
    if (dstTimer) clearInterval(dstTimer);
  });

  function closeTour() {
    tourOpen = false;
    tz.markTourSeen();
  }

  // ---- Pin drag ----
  function attachPinDrag(node: HTMLElement, zone: Zone) {
    const cleanup = attachDrag(node, {
      threshold: 4,
      axis: 'x',
      onStart() {
        node.classList.add('dragging');
        if (!tz.isManual) tz.setManual(true);
      },
      onMove(e) {
        const track = trackEl;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const x = clamp(e.clientX - rect.left, 0, rect.width);
        const localMin = Math.round((x / rect.width) * 1440);
        tz.setBaseUtcMin(mod(localMin - zone.offsetMin, 1440));
      },
      onEnd() {
        node.classList.remove('dragging');
      },
      onCancel() {
        node.classList.remove('dragging');
      }
    });
    return { destroy: cleanup };
  }

  // ---- Tag input ----
  let tagInputFor = $state<string | null>(null);
  let tagInputValue = $state('');

  function startAddTag(zoneId: string) {
    tagInputFor = zoneId;
    tagInputValue = '';
  }
  function commitTag() {
    if (tagInputFor && tagInputValue.trim()) {
      tz.addTag(tagInputFor, tagInputValue);
    }
    tagInputFor = null;
    tagInputValue = '';
  }
  function cancelTag() {
    tagInputFor = null;
    tagInputValue = '';
  }

  // ---- Copy ----
  async function doCopy() {
    const lines = tz.zones.map((z) => {
      const localMin = mod(tz.baseUtcMin + z.offsetMin, 1440);
      const dayOff = dayOffsetFor(tz.baseUtcMin, z.offsetMin);
      const dayTag = dayOff > 0 ? ' (+1d)' : dayOff < 0 ? ' (-1d)' : '';
      return `${z.name}: ${formatTime(localMin)}${dayTag}`;
    });
    const ok = await copyText(lines.join(' · '));
    if (ok) snackbar.show(i18n.m.tz.copied);
    else snackbar.show(i18n.m.tz.copyFailed, 'no');
  }

  function onPick(c: (typeof CATALOG)[number]) {
    if (tz.addZone(c)) pickerOpen = false;
  }

  function localTimeFor(z: Zone): string {
    const localMin = mod(tz.baseUtcMin + z.offsetMin, 1440);
    return formatTime(localMin);
  }
  function dayTagFor(z: Zone): string {
    const d = dayOffsetFor(tz.baseUtcMin, z.offsetMin);
    return d > 0 ? '+1d' : d < 0 ? '-1d' : '';
  }
  function pinLeftPct(z: Zone): number {
    const localMin = mod(tz.baseUtcMin + z.offsetMin, 1440);
    return (localMin / 1440) * 100;
  }

  // Svelte action: focus the input on mount. Used by the inline tag input.
  function focusOnMount(node: HTMLInputElement) {
    queueMicrotask(() => node.focus());
    return {};
  }
</script>

<svelte:head>
  <title>time tool · whiteout survival</title>
</svelte:head>

<main class="page">
  <PageHeader title={i18n.m.tz.title} sub={i18n.m.tz.sub}>
    {#snippet actions()}
      <button
        class="ibtn"
        aria-label={i18n.m.common.help}
        title={i18n.m.common.help}
        onclick={() => (tourOpen = true)}
      >
        <Icon name="circle-help" size={15} />
      </button>
    {/snippet}
  </PageHeader>

  <section class="slider-card">
    <div class="slider-info">
      <span class="mode-tag" class:live={!tz.isManual} class:manual={tz.isManual}>
        {#if !tz.isManual}<span class="dot"></span>{/if}
        {tz.isManual ? i18n.m.tz.manual : i18n.m.tz.live}
      </span>
      <button class="reset-btn" disabled={!tz.isManual} onclick={() => tz.resetToNow()}>
        {i18n.m.tz.resetToNow}
      </button>
    </div>
    <div class="utc-anchor">
      <div class="utc-anchor-label">{i18n.m.tz.utcLabel}</div>
      <div class="utc-anchor-time">{formatTime(tz.baseUtcMin)}</div>
      <div class="utc-anchor-ampm">{formatTimeAmPm(tz.baseUtcMin)}</div>
    </div>
    <!-- Slider stays LTR even when the page is RTL — time is a universal
         left-to-right progression. The surrounding controls (mode tag, reset
         button, zone list) still flow according to the page dir. -->
    <div class="slider-track" dir="ltr" bind:this={trackEl}>
      {#each Array(23) as _, i (i)}
        {@const h = i + 1}
        <div
          class="tick"
          class:major={h === 6 || h === 12 || h === 18}
          style="left: {(h / 24) * 100}%;"
        ></div>
      {/each}
      {#if tz.isManual}
        <div class="now-line" style="left: {(nowUtcMinutes() / 1440) * 100}%;">
          <span class="now-label">{i18n.m.tz.nowLabel}</span>
        </div>
      {/if}
      {#each tz.zones as zone (zone.id)}
        <div
          class="pin"
          style="left: {pinLeftPct(zone)}%; --c: {zone.color};"
          data-zone-id={zone.id}
          aria-label="{zone.name} at {localTimeFor(zone)}"
          use:attachPinDrag={zone}
        >
          <div class="pin-head"></div>
          <div class="pin-line"></div>
        </div>
      {/each}
    </div>
    <div class="tick-row" dir="ltr">
      <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
    </div>
  </section>

  <section class="zones">
    {#each sortedZones as zone (zone.id)}
      {#if zone.id === 'utc'}
        <div class="zone-row is-utc">
          <div class="zone-dot" style="background: {zone.color};"></div>
          <div class="zone-info"><div class="zone-name">UTC</div></div>
          <div class="zone-time">
            <span class="time-24h">{formatTime(tz.baseUtcMin)}</span>
            <span class="time-ampm">{formatTimeAmPm(tz.baseUtcMin)}</span>
          </div>
        </div>
      {:else}
        <div class="zone-row">
          <div class="zone-dot" style="background: {zone.color};"></div>
          <div class="zone-info">
            <div class="zone-name">{zone.name} · {formatOffset(zone.offsetMin)}</div>
            <div class="zone-loc">{zone.loc}</div>
            <div class="zone-tags">
              {#each zone.tags as t (t)}
                <span class="tag">
                  <span class="tag-text">{t}</span>
                  <button
                    class="tag-x"
                    aria-label="Remove {t}"
                    onclick={() => tz.removeTag(zone.id, t)}
                  >
                    <Icon name="x" size={10} />
                  </button>
                </span>
              {/each}
              {#if tagInputFor === zone.id}
                <input
                  class="tag-input"
                  type="text"
                  placeholder={i18n.m.tz.tagPlaceholder}
                  maxlength="24"
                  autocomplete="off"
                  bind:value={tagInputValue}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitTag();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelTag();
                    }
                  }}
                  onblur={commitTag}
                  use:focusOnMount
                />
              {:else}
                <button
                  class="tag-add"
                  aria-label="Add person"
                  onclick={() => startAddTag(zone.id)}
                >
                  <Icon name="plus" size={12} />
                </button>
              {/if}
            </div>
          </div>
          <div class="zone-time">
            <span class="time-24h">
              {localTimeFor(zone)}{#if dayTagFor(zone)}<span class="day-tag">{dayTagFor(zone)}</span
                >{/if}
            </span>
            <span class="time-ampm"
              >{formatTimeAmPm(mod(tz.baseUtcMin + zone.offsetMin, 1440))}</span
            >
          </div>
          {#if zone.removable}
            <button
              class="zone-remove"
              aria-label="Remove zone"
              onclick={() => tz.removeZone(zone.id)}
            >
              <Icon name="x" size={12} />
            </button>
          {/if}
        </div>
      {/if}
    {/each}
  </section>

  <div class="actions-row">
    <button class="action-btn" onclick={() => (pickerOpen = true)}>
      <Icon name="plus" size={14} />
      {i18n.m.tz.addTimezone}
    </button>
    <button class="action-btn" onclick={doCopy}>
      <Icon name="copy" size={14} />
      {i18n.m.tz.copyAsText}
    </button>
  </div>
</main>

<Modal open={pickerOpen} onClose={() => (pickerOpen = false)} label="Add timezone">
  <div class="picker-header">
    <h2 class="picker-title">{i18n.m.tz.addTimezone}</h2>
  </div>
  <input
    class="picker-search"
    type="text"
    placeholder={i18n.m.tz.searchPlaceholder}
    autocomplete="off"
    bind:value={pickerSearch}
  />
  <div class="picker-list">
    {#each filteredCatalog as c (c.id)}
      {@const used = tz.zones.some((z) => z.id === c.id)}
      <button class="picker-item" class:in-use={used} disabled={used} onclick={() => onPick(c)}>
        <div class="picker-item-label">
          <span class="picker-item-name">{c.name} · {c.loc}</span>
          <span class="picker-item-loc">{c.iana}</span>
        </div>
        <span class="picker-item-offset">{formatOffset(offsetMinutes(c.iana))}</span>
      </button>
    {:else}
      <div class="picker-empty">{i18n.m.tz.nothingMatches}</div>
    {/each}
  </div>
</Modal>

<Tutorial
  open={tourOpen}
  onClose={closeTour}
  slides={[
    {
      title: i18n.m.tz.tour.welcomeTitle,
      caption: i18n.m.tz.tour.welcomeCaption,
      svg: TZ_SLIDES[0].svg()
    },
    {
      title: i18n.m.tz.tour.dragTitle,
      caption: i18n.m.tz.tour.dragCaption,
      svg: TZ_SLIDES[1].svg()
    },
    { title: i18n.m.tz.tour.addTitle, caption: i18n.m.tz.tour.addCaption, svg: TZ_SLIDES[2].svg() },
    {
      title: i18n.m.tz.tour.modeTitle,
      caption: i18n.m.tz.tour.modeCaption,
      svg: TZ_SLIDES[3].svg()
    },
    {
      title: i18n.m.tz.tour.tagsTitle,
      caption: i18n.m.tz.tour.tagsCaption,
      svg: TZ_SLIDES[4].svg()
    }
  ]}
/>

<style>
  .page {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 18px 80px;
  }
  .ibtn {
    width: 36px;
    height: 36px;
    border-radius: var(--r-pill);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-mid);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .ibtn:hover {
    color: var(--text);
    background: var(--surface-hover);
    border-color: var(--border-strong);
  }

  /* Slider */
  .slider-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 22px;
    margin-bottom: 18px;
  }
  .slider-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .mode-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: var(--r-pill);
    border: 1px solid var(--border);
  }
  .mode-tag.live {
    color: var(--ok);
    border-color: rgba(110, 231, 168, 0.45);
    background: rgba(110, 231, 168, 0.1);
  }
  .mode-tag.live .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ok);
    animation: pulse-dot 1.4s ease-in-out infinite;
  }
  .mode-tag.manual {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  @keyframes pulse-dot {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }
  .reset-btn {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-mid);
    border-radius: var(--r-pill);
    padding: 6px 14px;
    cursor: pointer;
  }
  .reset-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .reset-btn:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .utc-anchor {
    text-align: center;
    margin-bottom: 14px;
  }
  .utc-anchor-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 4px;
    padding-inline-start: 0.4em;
  }
  .utc-anchor-time {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 800;
    font-size: clamp(48px, 12vw, 80px);
    line-height: 1;
    letter-spacing: -0.035em;
    background: linear-gradient(180deg, #ffffff 25%, #93d4ff 130%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .utc-anchor-ampm {
    /* Secondary 12h read of the same UTC time — small, dim, mono. */
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 8px;
  }
  .slider-track {
    position: relative;
    height: 70px;
    margin: 14px 0 6px;
    border-radius: var(--r-pill);
    background: rgba(255, 255, 255, 0.03);
    touch-action: pan-y;
  }
  @media (min-width: 640px) {
    .slider-track {
      height: 80px;
    }
  }
  .tick {
    position: absolute;
    top: 14px;
    bottom: 14px;
    width: 1px;
    background: rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }
  .tick.major {
    background: rgba(255, 255, 255, 0.18);
  }
  .now-line {
    position: absolute;
    top: 6px;
    bottom: 6px;
    width: 0;
    /* physical because the parent .slider-track is dir=ltr */
    border-left: 1px dashed rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }
  .now-label {
    position: absolute;
    top: -16px;
    left: 4px;
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .pin {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 36px;
    /* margin-left is physical on purpose — the slider is forced LTR via
     * dir="ltr" on .slider-track so the pin's center stays at left:X%. */
    margin-left: -18px;
    cursor: grab;
    touch-action: none;
  }
  .pin .pin-line {
    position: absolute;
    top: 18px;
    bottom: 0;
    left: 17px;
    width: 2px;
    background: var(--c);
    box-shadow: 0 0 8px var(--c);
    border-radius: 1px;
    pointer-events: none;
    transition: width 0.15s ease;
  }
  .pin .pin-head {
    position: absolute;
    top: 12px;
    left: 13px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--c);
    box-shadow: 0 0 12px var(--c);
    pointer-events: none;
    transition: transform 0.15s ease;
  }
  /* :global(.dragging) — class is added by JS during drag. */
  .pin:global(.dragging) .pin-head {
    transform: scale(1.3);
  }
  .pin:global(.dragging) .pin-line {
    width: 3px;
  }
  .tick-row {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 1px;
    padding: 0 4px;
  }
  .tick-row span {
    flex: 0 0 auto;
  }
  .tick-row span:first-child {
    transform: translateX(0);
  }
  .tick-row span:last-child {
    transform: translateX(0);
  }

  /* Zones */
  .zones {
    display: grid;
    gap: 8px;
    margin-bottom: 18px;
  }
  .zone-row {
    display: grid;
    grid-template-columns: 12px 1fr auto 28px;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .zone-row.is-utc {
    grid-template-columns: 12px 1fr auto;
    padding: 10px 16px;
    background: rgba(147, 212, 255, 0.05);
    border-color: var(--border-accent);
  }
  .zone-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    box-shadow: 0 0 8px currentColor;
  }
  .zone-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text);
    letter-spacing: 1px;
  }
  .is-utc .zone-name {
    text-transform: uppercase;
    color: var(--accent);
    letter-spacing: 3px;
  }
  .zone-loc {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 2px;
    letter-spacing: 0.5px;
  }
  .zone-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
    align-items: center;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px 3px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-mid);
  }
  .tag-x {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: transparent;
    border: 0;
    color: var(--text-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .tag-x:hover {
    background: var(--surface-hover);
    color: var(--no);
  }
  .tag-add {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: transparent;
    border: 1px dashed rgba(255, 255, 255, 0.2);
    color: var(--text-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .tag-add:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }
  .tag-input {
    background: var(--bg-soft);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-pill);
    color: var(--text);
    padding: 3px 10px;
    font-family: var(--font-mono);
    font-size: 10px;
    width: 90px;
    outline: none;
  }
  .tag-input:focus {
    border-color: var(--border-accent);
  }
  .zone-time {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.05;
  }
  .time-24h {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 22px;
    letter-spacing: -0.01em;
  }
  .time-ampm {
    /* 12h companion — small, dim mono so the 24h reading stays the headline. */
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 2px;
  }
  .is-utc .time-24h {
    font-size: 18px;
  }
  .is-utc .time-ampm {
    font-size: 8.5px;
  }
  .day-tag {
    display: inline-block;
    font-family: var(--font-mono);
    font-style: normal;
    font-size: 9px;
    color: var(--text-dim);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 1px 5px;
    margin-inline-start: 6px;
    letter-spacing: 0.5px;
    transform: translateY(-3px);
  }
  .zone-remove {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: transparent;
    border: 0;
    color: var(--text-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .zone-remove:hover {
    color: var(--no);
    background: var(--surface);
  }

  /* Actions */
  .actions-row {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .action-btn {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--r-pill);
    padding: 12px 22px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .action-btn:hover {
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }

  /* Picker */
  .picker-header {
    margin-bottom: 12px;
  }
  .picker-title {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 20px;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .picker-search {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    padding: 10px 14px;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    outline: none;
    margin-bottom: 12px;
  }
  .picker-search:focus {
    border-color: var(--border-accent);
  }
  .picker-list {
    max-height: 50vh;
    overflow-y: auto;
    display: grid;
    gap: 4px;
  }
  .picker-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    background: transparent;
    border: 0;
    border-radius: 10px;
    color: var(--text);
    cursor: pointer;
    text-align: start;
    width: 100%;
  }
  .picker-item:hover:not(:disabled) {
    background: var(--surface);
  }
  .picker-item.in-use {
    opacity: 0.4;
    cursor: default;
  }
  .picker-item-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .picker-item-name {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.5px;
  }
  .picker-item-loc {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 0.5px;
  }
  .picker-item-offset {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent);
    letter-spacing: 0.5px;
  }
  .picker-empty {
    padding: 18px;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }

  @media (max-width: 540px) {
    .zone-row {
      gap: 8px;
      padding: 12px;
    }
    .time-24h {
      font-size: 18px;
    }
    .tag-x,
    .tag-add,
    .zone-remove {
      min-width: 32px;
      min-height: 32px;
    }
  }
</style>
