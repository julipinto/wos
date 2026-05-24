<script lang="ts">
  import { onMount } from 'svelte';
  import Jar from '$lib/components/Jar.svelte';
  import Tutorial from '$lib/components/Tutorial.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
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
    // Offset from the cursor to the row's top at grab time. Keeps the grab
    // point under the finger/cursor so the row doesn't "snap" to center.
    let grabOffsetY = 0;

    function settle() {
      // Animate transform back to natural position, then clear inline styles.
      node.style.transition = 'transform .22s cubic-bezier(.2,.6,.3,1)';
      node.style.transform = '';
      setTimeout(() => {
        node.style.transition = '';
      }, 240);
      node.classList.remove('dragging');
      dragging = false;
    }

    const cleanup = attachDrag(node, {
      threshold: 6,
      axis: 'y',
      onStart(e) {
        dragging = true;
        node.classList.add('dragging');
        grid = node.parentElement;
        const rect = node.getBoundingClientRect();
        grabOffsetY = e.clientY - rect.top;
        // Suppress the FLIP transition on the dragged row itself; we're
        // controlling it directly via transform.
        node.style.transition = 'none';
      },
      onMove(e) {
        if (!dragging || !grid) return;

        // 1) Reorder DOM if the cursor crossed into another row's midline.
        //    This shuffles the SIBLINGS via FLIP — the dragged row's DOM slot
        //    might change here, which is fine; we recompute its transform below.
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

        // 2) Position the dragged row so its top is at (cursor − grabOffset).
        //    offsetTop reflects the row's CURRENT natural top relative to the
        //    grid (post-reorder), so this stays accurate even when the dragged
        //    row's DOM slot just changed.
        const gridRect = grid.getBoundingClientRect();
        const targetTopInGrid = e.clientY - grabOffsetY - gridRect.top;
        const dy = targetTopInGrid - node.offsetTop;
        node.style.transform = `translateY(${dy}px)`;
      },
      onEnd(_, committed) {
        if (committed && grid) {
          const newOrder = [...grid.querySelectorAll<HTMLElement>('.inv-row')]
            .map((r) => r.dataset.hex)
            .filter((x): x is string => !!x);
          slush.setInventoryOrder(newOrder);
        }
        settle();
      },
      onCancel() {
        settle();
      }
    });
    return { destroy: cleanup, _ref: hex };
  }
</script>

<svelte:head>
  <title>slush station · whiteout survival</title>
</svelte:head>

<main class="page">
  <PageHeader title={i18n.m.landing.slush.title} sub={i18n.m.landing.slush.desc}>
    {#snippet actions()}
      <button
        class="ibtn"
        aria-label={i18n.m.common.settings}
        title={i18n.m.common.settings}
        onclick={() => (settingsOpen = !settingsOpen)}
      >
        <Icon name="settings" size={15} />
      </button>
      <button
        class="ibtn"
        aria-label={i18n.m.common.reset}
        title={i18n.m.common.reset}
        onclick={onReset}
      >
        <Icon name="rotate-ccw" size={15} />
      </button>
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

  {#if settingsOpen}
    <section class="panel settings">
      <div class="panel-bar">
        <span class="eyebrow">{i18n.m.slush.inventoryEyebrow}</span>
        <button
          class="ibtn-sm"
          aria-label={i18n.m.common.close}
          onclick={() => (settingsOpen = false)}
        >
          <Icon name="x" size={12} />
        </button>
      </div>
      <div class="inv-grid">
        {#each uniqueColors as hex (hex)}
          {@const count = slush.inventory.filter((x) => x === hex).length}
          <div class="inv-row" data-hex={hex} use:attachRowDrag={hex}>
            <div class="inv-grip" aria-label="Drag to reorder" style="touch-action: none;">
              <Icon name="grip-vertical" size={16} />
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
                <Icon name="minus" size={14} />
              </button>
              <button
                class="ibtn-sm"
                aria-label="Add one"
                disabled={!colorsAvailable}
                onclick={() => slush.addInventoryColor(hex)}
              >
                <Icon name="plus" size={14} />
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
          <Icon name="plus" size={12} />
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
        {i18n.m.slush.totalLabel} <b>{slush.inventory.length}</b>
        {i18n.m.slush.jarsLabel}
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
                    <line
                      x1="4"
                      y1="4"
                      x2="18"
                      y2="18"
                      stroke="#ff8a8a"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                    <line
                      x1="18"
                      y1="4"
                      x2="4"
                      y2="18"
                      stroke="#ff8a8a"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
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
                    <div
                      class="fb {round.feedback[i] === true
                        ? 'ok'
                        : round.feedback[i] === false
                          ? 'no'
                          : ''}"
                    >
                      {#if round.feedback[i] === true}
                        <Icon name="check" size={12} />
                      {:else if round.feedback[i] === false}
                        <Icon name="x" size={12} />
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
              <button class="del" aria-label="Delete round" onclick={() => slush.deleteRound(ri)}>
                <Icon name="x" size={14} />
              </button>
            </div>
          {/each}

          {#if slush.isWon}
            <div class="won">
              <Icon name="circle-check" size={22} />
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
                      class="fb {slush.currentFeedback[i] === true
                        ? 'ok'
                        : slush.currentFeedback[i] === false
                          ? 'no'
                          : ''}"
                      disabled={locked}
                      aria-label="Cycle feedback"
                      onclick={() => slush.cycleFeedback(i)}
                    >
                      {#if slush.currentFeedback[i] === true}
                        <Icon name="check" size={12} />
                      {:else if slush.currentFeedback[i] === false}
                        <Icon name="x" size={12} />
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
                <Icon name="arrow-right" size={14} />
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
            {@const possibles = new Set(sol.perPosition[i] ?? [])}
            <div class="pos-col" class:empty={possibles.size === 0 && slush.rounds.length > 0}>
              <span class="pos-tag">{i + 1}</span>
              <div class="mini-jars">
                {#if possibles.size === 0 && slush.rounds.length > 0}
                  <span class="x-mark" aria-hidden="true">
                    <Icon name="x" size={14} />
                  </span>
                {:else}
                  <!-- Iterate uniqueColors (inventory order) and filter by what's
                       still possible at slot i — so the same color lands in the
                       same vertical row across columns, matching the legacy
                       slush.html behavior. -->
                  {#each uniqueColors as hex (hex)}
                    {#if possibles.has(hex)}
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
                    {/if}
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
            <Icon name="lightbulb" size={14} />
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
    /* Lifted state: stronger shadow, accent border, slightly larger and
     * brighter so the row clearly reads as "in-hand". */
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.55);
    border-color: var(--border-accent);
    background: var(--surface-strong);
    position: relative;
    z-index: 5;
    cursor: grabbing;
  }
  .inv-row.dragging .inv-grip,
  .inv-row.dragging .inv-jar {
    cursor: grabbing;
  }
  .inv-grip {
    color: var(--text-dim);
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
  }
  .inv-grip:hover {
    color: var(--text-mid);
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
    justify-content: center;
    gap: 10px;
  }
  @media (max-width: 540px) {
    .palette {
      /* On phones the palette needs to fit 6-8 jars on one row at ~320 px;
       * the 14 px gap blew that out. */
      gap: 6px;
    }
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
    /* Single row: slots flex 1 + action button (del/submit) at the far end.
     * The button is centered against the jars; the badge floats in the
     * corner outside the flow. */
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 14px;
  }
  .round.current {
    border-color: var(--border-strong);
    background: var(--surface-hover);
  }
  .round-num {
    /* Tiny corner badge — visible reference for which round you're on without
     * eating any horizontal space from the jar row. */
    position: absolute;
    top: 4px;
    inset-inline-start: 10px;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1.5px;
    color: var(--text-dim);
    line-height: 1;
    pointer-events: none;
  }
  .slots {
    flex: 1;
    /* Match the legacy slush.html: jars sit horizontally centered inside the
     * row, not stuck to the left edge. */
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  /* Push the action all the way to the right edge of the card. */
  .round .del,
  .round .submit {
    margin-inline-start: auto;
    margin-inline-end: -2px;
  }
  @media (max-width: 540px) {
    .round {
      padding: 10px;
      gap: 6px;
    }
    .slots {
      gap: 4px;
    }
  }
  .slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .slot.locked .slot-jar {
    box-shadow:
      0 0 0 2px var(--ok),
      0 0 14px rgba(110, 231, 168, 0.35);
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
    color: var(--ok);
  }
  .fb.no {
    background: rgba(255, 138, 138, 0.22);
    border-color: rgba(255, 138, 138, 0.65);
    color: var(--no);
  }
  .x-mark {
    color: var(--no);
    display: inline-flex;
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
