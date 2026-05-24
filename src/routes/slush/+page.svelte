<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import Jar from '$lib/components/Jar.svelte';
  import Tutorial from '$lib/components/Tutorial.svelte';
  import { snackbar } from '$lib/stores/snackbar.svelte';
  import { attachDrag } from '$lib/utils/drag';
  import { flipReorder } from '$lib/utils/flip';
  import { slush, COLOR_POOL, MAX_JARS, MIN_JARS } from '$lib/tools/slush/store.svelte';
  import { SLUSH_SLIDES } from '$lib/tools/slush/tutorial';
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import '$lib/tools/slush/tutorial.css';

  let settingsOpen = $state(false);
  let pickerOpen = $state(false);
  let tourOpen = $state(false);

  const sol = $derived(slush.solution);
  const confirmed = $derived(slush.confirmed);
  const remaining = $derived(slush.remaining());
  // Preserves the inventory's order (Set keeps insertion order); used for both
  // the palette and the inventory editor — one row per unique color.
  const uniqueColors = $derived([...new Set(slush.inventory)]);
  const colorsAvailable = $derived(slush.inventory.length < MAX_JARS);
  const nextEmptySlot = $derived.by(() => {
    const N = slush.slots;
    for (let i = 0; i < N; i++) {
      if (slush.currentGuess[i] === null && !confirmed[i]) return i;
    }
    return -1;
  });

  onMount(() => {
    if (!slush.hasSeenTour()) tourOpen = true;
  });

  function closeTour() {
    tourOpen = false;
    slush.markTourSeen();
  }

  function onPaletteClick(hex: string) {
    const remaining = slush.remaining();
    const left = remaining.get(hex) ?? 0;
    if (left <= 0) {
      snackbar.show(i18n.m.slush.allUsedUp, 'no');
      return;
    }
    const N = slush.slots;
    const confirmed = slush.confirmed;
    // Find the next slot the user can fill — first empty unlocked
    let nextSlot = -1;
    for (let i = 0; i < N; i++) {
      if (slush.currentGuess[i] === null && !confirmed[i]) {
        nextSlot = i;
        break;
      }
    }
    if (nextSlot === -1) {
      snackbar.show(i18n.m.slush.rowFull, 'no');
      return;
    }
    if (slush.blockedAt(nextSlot).has(hex)) {
      snackbar.show(fmt(i18n.m.slush.blockedAtSlot, { slot: nextSlot + 1 }), 'no');
      return;
    }
    slush.placeAt(nextSlot, hex);
  }

  function onReset() {
    slush.resetRounds();
  }

  function onAddColorPick(hex: string) {
    slush.addInventoryColor(hex);
    pickerOpen = false;
  }

  function attachRowDrag(node: HTMLElement, hex: string) {
    let dragging = false;
    let grid: HTMLElement | null = null;
    const cleanup = attachDrag(node, {
      threshold: 6,
      axis: 'y',
      onStart() {
        dragging = true;
        node.classList.add('dragging');
        grid = node.parentElement;
      },
      onMove(e) {
        if (!dragging || !grid) return;
        const others = [...grid.querySelectorAll<HTMLElement>('.inv-row:not(.dragging)')];
        const target = others.find((r) => {
          const rect = r.getBoundingClientRect();
          return e.clientY >= rect.top && e.clientY <= rect.bottom;
        });
        if (target) {
          const rect = target.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const beforeNode = e.clientY < midY ? target : target.nextSibling;
          flipReorder(grid, node, beforeNode);
        }
      },
      onEnd(_, committed) {
        node.classList.remove('dragging');
        if (committed && grid) {
          const newOrder = [...grid.querySelectorAll<HTMLElement>('.inv-row')]
            .map((r) => r.dataset.hex)
            .filter((x): x is string => !!x);
          slush.setInventoryOrder(newOrder);
        }
        dragging = false;
      },
      onCancel() {
        node.classList.remove('dragging');
        dragging = false;
      }
    });
    return { destroy: cleanup, _ref: hex };
  }
</script>

<svelte:head>
  <title>slush station · whiteout survival</title>
</svelte:head>

<main class="page">
  <header class="bar">
    <a class="brand" href="{base}/" aria-label="Back to tools">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M9 3 L4 7 L9 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="brand-name">{i18n.m.slush.brand}</span>
      <span class="brand-sub">{i18n.m.slush.brandSub}</span>
    </a>
    <div class="actions">
      <button class="ibtn" aria-label="Settings" onclick={() => (settingsOpen = !settingsOpen)}>
        <!-- Gear icon: outer cog with 8 teeth + inner ring. -->
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 1.5 L8.7 3.4 L10.6 2.9 L10.6 4.9 L12.5 5.7 L11.5 7.4 L13.1 8.7 L11.5 10 L12.5 11.7 L10.6 12.5 L10.6 14.5 L8.7 14 L8 15.9 L7.3 14 L5.4 14.5 L5.4 12.5 L3.5 11.7 L4.5 10 L2.9 8.7 L4.5 7.4 L3.5 5.7 L5.4 4.9 L5.4 2.9 L7.3 3.4 Z"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linejoin="round"
            fill="none"
          />
          <circle cx="8" cy="8.7" r="2" stroke="currentColor" stroke-width="1.3" />
        </svg>
      </button>
      <button class="ibtn" aria-label="Reset" onclick={onReset}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 4 a5 5 0 1 1 -1 5 L1 8 M1 8 L3 8 M1 8 L1 5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button class="ibtn" aria-label="Help" onclick={() => (tourOpen = true)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5" />
          <path d="M6 6 a2 2 0 1 1 2 2 v1.5 M8 11.5 v0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </header>

  {#if settingsOpen}
    <section class="panel settings">
      <div class="panel-bar">
        <span class="eyebrow">{i18n.m.slush.inventoryEyebrow}</span>
        <button class="ibtn-sm" aria-label="Close" onclick={() => (settingsOpen = false)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="inv-grid">
        {#each uniqueColors as hex (hex)}
          {@const count = slush.inventory.filter((x) => x === hex).length}
          <div class="inv-row" data-hex={hex} use:attachRowDrag={hex}>
            <div class="inv-grip" aria-label="Drag to reorder" style="touch-action: none;">
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none" aria-hidden="true">
                <circle cx="4" cy="5" r="1.5" fill="currentColor" />
                <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                <circle cx="4" cy="10" r="1.5" fill="currentColor" />
                <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                <circle cx="4" cy="15" r="1.5" fill="currentColor" />
                <circle cx="10" cy="15" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div class="inv-jar" style="touch-action: none;">
              <Jar {hex} scale={0.9} />
            </div>
            <span class="inv-count">×{count}</span>
            <div class="inv-ctrls">
              <button
                class="ibtn-sm"
                aria-label="Remove one"
                disabled={slush.inventory.length <= MIN_JARS}
                onclick={() => slush.decrementInventoryColor(hex)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7 H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
              <button
                class="ibtn-sm"
                aria-label="Add one"
                disabled={!colorsAvailable}
                onclick={() => slush.addInventoryColor(hex)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 3 V11 M3 7 H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
      <div class="add-row">
        <button
          class="add-btn"
          disabled={slush.inventory.length >= MAX_JARS}
          onclick={() => (pickerOpen = !pickerOpen)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 3 V11 M3 7 H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          {i18n.m.slush.addColor}
        </button>
      </div>
      {#if pickerOpen}
        <div class="color-picker">
          {#each COLOR_POOL.filter((h) => !slush.inventory.includes(h)) as hex (hex)}
            <button
              class="picker-swatch"
              style="background: {hex};"
              aria-label={hex}
              onclick={() => onAddColorPick(hex)}
            ></button>
          {:else}
            <span class="picker-empty">all colors added · use + on a row to duplicate</span>
          {/each}
        </div>
      {/if}
      <div class="inv-total">
        {i18n.m.slush.totalLabel} <b>{slush.inventory.length}</b> {i18n.m.slush.jarsLabel}
      </div>
    </section>
  {/if}

  <div class="work">
    <div class="col col-input">
      <section class="panel">
        <div class="panel-bar"><span class="eyebrow">{i18n.m.slush.paletteEyebrow}</span></div>
        <div class="palette">
          {#each uniqueColors as hex (hex)}
            {@const left = remaining.get(hex) ?? 0}
            {@const total = slush.inventory.filter((x) => x === hex).length}
            {@const blocked = nextEmptySlot >= 0 && slush.blockedAt(nextEmptySlot).has(hex)}
            <button
              class="jar-btn"
              class:depleted={left <= 0}
              class:blocked
              onclick={() => onPaletteClick(hex)}
            >
              <Jar {hex} scale={1} />
              {#if total > 1}
                <span class="count-badge" class:depleted={left <= 0}>{left}/{total}</span>
              {/if}
              {#if blocked && left > 0}
                <span class="block-x" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <line x1="4" y1="4" x2="18" y2="18" stroke="#ff8a8a" stroke-width="2.5" stroke-linecap="round" />
                    <line x1="18" y1="4" x2="4" y2="18" stroke="#ff8a8a" stroke-width="2.5" stroke-linecap="round" />
                  </svg>
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </section>

      <section class="panel">
        <div class="panel-bar"><span class="eyebrow">{i18n.m.slush.roundsEyebrow}</span></div>
        <div class="rounds">
          {#each slush.rounds as round, ri (ri)}
            <div class="round">
              <span class="round-num">#{ri + 1}</span>
              <div class="slots">
                {#each round.guess as hex, i (i)}
                  <div class="slot small">
                    <Jar {hex} scale={0.75} />
                    <div class="fb {round.feedback[i] === true ? 'ok' : round.feedback[i] === false ? 'no' : ''}">
                      {#if round.feedback[i] === true}
                        <svg viewBox="-6 -6 12 12" width="14" height="14" aria-hidden="true">
                          <polyline points="-4 0 -1 3 4 -3" fill="none" stroke="#6ee7a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      {:else if round.feedback[i] === false}
                        <svg viewBox="-6 -6 12 12" width="14" height="14" aria-hidden="true">
                          <line x1="-3" y1="-3" x2="3" y2="3" stroke="#ff8a8a" stroke-width="2" stroke-linecap="round" />
                          <line x1="3" y1="-3" x2="-3" y2="3" stroke="#ff8a8a" stroke-width="2" stroke-linecap="round" />
                        </svg>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
              <button class="del" aria-label="Delete round" onclick={() => slush.deleteRound(ri)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          {/each}

          {#if slush.isWon}
            <div class="won">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.5" />
                <polyline points="8 12 11 15 16 9" />
              </svg>
              <span>{i18n.m.slush.solved}</span>
            </div>
          {:else}
            <div class="round current">
              <span class="round-num">#{slush.rounds.length + 1}</span>
              <div class="slots">
                {#each slush.currentGuess as hex, i (i)}
                  {@const locked = confirmed[i] !== null}
                  <div class="slot" class:locked>
                    {#if hex}
                      <button
                        class="slot-jar"
                        disabled={locked}
                        aria-label="Clear slot"
                        onclick={() => slush.clearSlot(i)}
                      >
                        <Jar {hex} scale={0.85} />
                      </button>
                    {:else}
                      <div class="slot-empty">
                        <Jar hex="#000" empty scale={0.85} />
                      </div>
                    {/if}
                    <button
                      class="fb {slush.currentFeedback[i] === true ? 'ok' : slush.currentFeedback[i] === false ? 'no' : ''}"
                      disabled={locked}
                      aria-label="Cycle feedback"
                      onclick={() => slush.cycleFeedback(i)}
                    >
                      {#if slush.currentFeedback[i] === true}
                        <svg viewBox="-6 -6 12 12" width="14" height="14" aria-hidden="true">
                          <polyline points="-4 0 -1 3 4 -3" fill="none" stroke="#6ee7a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      {:else if slush.currentFeedback[i] === false}
                        <svg viewBox="-6 -6 12 12" width="14" height="14" aria-hidden="true">
                          <line x1="-3" y1="-3" x2="3" y2="3" stroke="#ff8a8a" stroke-width="2" stroke-linecap="round" />
                          <line x1="3" y1="-3" x2="-3" y2="3" stroke="#ff8a8a" stroke-width="2" stroke-linecap="round" />
                        </svg>
                      {/if}
                    </button>
                  </div>
                {/each}
              </div>
              <button
                class="submit"
                disabled={!slush.currentFilled}
                aria-label="Submit round"
                onclick={() => slush.submitRound()}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 10 H14 M10 6 L14 10 L10 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          {/if}
        </div>
      </section>
    </div>

    <div class="col col-output">
      <section class="panel">
        <div class="panel-bar"><span class="eyebrow">{i18n.m.slush.solverEyebrow}</span></div>
        <div class="count">
          <div
            class="count-num"
            class:solved={sol.total === 1}
            class:impossible={sol.contradiction}
            class:large={sol.total > 9999}
          >
            {sol.contradiction ? '—' : sol.truncated ? '50k+' : sol.total}
          </div>
          <div class="count-label">
            {sol.contradiction
              ? i18n.m.slush.noSolution
              : sol.total === 1
                ? i18n.m.slush.solved
                : i18n.m.slush.possibilities}
          </div>
        </div>

        <div class="pos-grid">
          {#each Array(slush.slots) as _, i (i)}
            {@const colors = sol.perPosition[i] ?? []}
            <div class="pos-col" class:empty={colors.length === 0 && slush.rounds.length > 0}>
              <span class="pos-tag">{i + 1}</span>
              <div class="mini-jars">
                {#if colors.length === 0 && slush.rounds.length > 0}
                  <span class="x-mark" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <line x1="3" y1="3" x2="11" y2="11" stroke="#ff8a8a" stroke-width="2" stroke-linecap="round" />
                      <line x1="11" y1="3" x2="3" y2="11" stroke="#ff8a8a" stroke-width="2" stroke-linecap="round" />
                    </svg>
                  </span>
                {:else}
                  {#each colors as hex (hex)}
                    {@const left = remaining.get(hex) ?? 0}
                    {@const softOut = left <= 0 && slush.currentGuess[i] !== hex}
                    <button
                      class="mini-jar"
                      class:soft-out={softOut}
                      disabled={softOut}
                      onclick={() => {
                        if ((remaining.get(hex) ?? 0) > 0) slush.placeAt(i, hex);
                      }}
                    >
                      <Jar {hex} scale={0.55} />
                    </button>
                  {/each}
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <div class="suggest-bar">
          <button
            class="suggest"
            disabled={sol.valid.length === 0}
            onclick={() => slush.applySuggestion()}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="6" r="3.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M5 12 H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            {i18n.m.slush.suggest}
          </button>
        </div>
      </section>
    </div>
  </div>
</main>

<Tutorial
  open={tourOpen}
  onClose={closeTour}
  slides={[
    {
      title: i18n.m.slush.tour.welcomeTitle,
      caption: i18n.m.slush.tour.welcomeCaption,
      svg: SLUSH_SLIDES[0].svg()
    },
    {
      title: i18n.m.slush.tour.inventoryTitle,
      caption: i18n.m.slush.tour.inventoryCaption,
      svg: SLUSH_SLIDES[1].svg()
    },
    {
      title: i18n.m.slush.tour.placeTitle,
      caption: i18n.m.slush.tour.placeCaption,
      svg: SLUSH_SLIDES[2].svg()
    },
    {
      title: i18n.m.slush.tour.feedbackTitle,
      caption: i18n.m.slush.tour.feedbackCaption,
      svg: SLUSH_SLIDES[3].svg()
    },
    {
      title: i18n.m.slush.tour.solverTitle,
      caption: i18n.m.slush.tour.solverCaption,
      svg: SLUSH_SLIDES[4].svg()
    }
  ]}
/>

<style>
  .page {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 32px 18px 80px;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--text-mid);
    text-decoration: none;
  }
  .brand:hover {
    color: var(--text);
  }
  .brand-name {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 22px;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .brand-sub {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
    padding-top: 2px;
  }
  .actions {
    display: inline-flex;
    gap: 8px;
  }
  .ibtn,
  .ibtn-sm {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-mid);
    border-radius: var(--r-pill);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .ibtn {
    width: 36px;
    height: 36px;
  }
  .ibtn-sm {
    width: 26px;
    height: 26px;
  }
  .ibtn:hover,
  .ibtn-sm:hover:not(:disabled) {
    background: var(--surface-hover);
    color: var(--text);
  }
  .ibtn-sm:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 16px 18px 20px;
    margin-bottom: 16px;
  }
  .panel-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  /* Settings / inventory editor */
  .settings .inv-grid {
    display: grid;
    gap: 8px;
  }
  .inv-row {
    display: grid;
    grid-template-columns: 28px 44px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  .inv-row.dragging {
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
    border-color: var(--border-accent);
    z-index: 2;
  }
  .inv-grip {
    color: var(--text-dim);
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .inv-jar {
    cursor: grab;
  }
  .inv-count {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .inv-ctrls {
    display: inline-flex;
    gap: 4px;
  }
  .picker-empty {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.5px;
  }
  .add-row {
    margin-top: 12px;
  }
  .add-btn {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    background: transparent;
    border: 1px dashed var(--border-strong);
    color: var(--text-mid);
    border-radius: var(--r-pill);
    padding: 8px 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .add-btn:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .add-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .picker-swatch {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.4);
    cursor: pointer;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
  .inv-total {
    margin-top: 14px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
    letter-spacing: 0.5px;
  }
  .inv-total b {
    color: var(--text);
    margin: 0 4px;
  }

  /* Layout: column on mobile, 2-col at >=1024px */
  .work {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .work {
      grid-template-columns: 1.08fr 0.92fr;
      gap: 24px;
    }
    .col-output {
      position: sticky;
      top: 24px;
      align-self: start;
    }
  }

  /* Palette */
  .palette {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }
  .jar-btn {
    position: relative;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .jar-btn:hover {
    transform: translateY(-2px);
  }
  .jar-btn.depleted {
    opacity: 0.3;
    cursor: default;
  }
  .jar-btn.depleted:hover {
    transform: none;
  }
  .jar-btn.blocked {
    opacity: 0.85;
  }
  .count-badge {
    position: absolute;
    top: -4px;
    inset-inline-end: -4px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    color: var(--text-mid);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: var(--r-pill);
    font-family: var(--font-mono);
  }
  .count-badge.depleted {
    color: var(--no);
  }
  .block-x {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  /* Rounds */
  .rounds {
    display: grid;
    gap: 10px;
  }
  .round {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
  }
  .round.current {
    border-color: var(--border-strong);
    background: var(--surface-hover);
  }
  .round-num {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    color: var(--text-dim);
    text-align: center;
  }
  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .slot.locked .slot-jar {
    box-shadow: 0 0 0 2px var(--ok), 0 0 14px rgba(110, 231, 168, 0.35);
    border-radius: 12px;
  }
  .slot-jar {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
  .slot.locked .slot-jar {
    cursor: default;
  }
  .slot-empty {
    opacity: 0.85;
  }
  .fb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .fb.ok {
    background: rgba(110, 231, 168, 0.22);
    border-color: rgba(110, 231, 168, 0.65);
  }
  .fb.no {
    background: rgba(255, 138, 138, 0.22);
    border-color: rgba(255, 138, 138, 0.65);
  }
  .fb:disabled {
    cursor: default;
  }
  .del,
  .submit {
    width: 28px;
    height: 28px;
    border-radius: var(--r-pill);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-mid);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .submit:not(:disabled) {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .submit:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .won {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    color: var(--ok);
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 600;
    font-size: 18px;
  }

  /* Count display */
  .count {
    text-align: center;
    margin-bottom: 14px;
  }
  .count-num {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 800;
    font-size: 56px;
    line-height: 1;
    letter-spacing: -0.03em;
    color: var(--text);
  }
  .count-num.solved {
    color: var(--ok);
  }
  .count-num.impossible {
    color: var(--no);
  }
  .count-num.large {
    font-size: 36px;
  }
  .count-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 6px;
  }

  /* Position grid */
  .pos-grid {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 6px;
    margin-top: 10px;
  }
  .pos-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 8px 4px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
  }
  .pos-col.empty {
    background: rgba(255, 138, 138, 0.06);
  }
  .pos-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 1.5px;
  }
  .mini-jars {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }
  .mini-jar {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
  .mini-jar.soft-out {
    opacity: 0.35;
    pointer-events: none;
  }

  .suggest-bar {
    display: flex;
    justify-content: center;
    margin-top: 14px;
  }
  .suggest {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-radius: var(--r-pill);
    border: 1px solid var(--border-accent);
    background: var(--accent-glow);
    color: var(--text);
    padding: 10px 18px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .suggest:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .suggest:hover:not(:disabled) {
    background: rgba(147, 212, 255, 0.28);
  }

</style>
