<script lang="ts">
  import { onMount } from 'svelte';
  import Icon, { type IconName } from '$lib/components/Icon.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Tutorial from '$lib/components/Tutorial.svelte';
  import { snackbar } from '$lib/stores/snackbar.svelte';
  import { copyText } from '$lib/utils/copy';
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import { gingado, SIM_N, COMPARE_N, RANGES } from '$lib/tools/gingado/store.svelte';
  import {
    LW,
    LH,
    BALL_R,
    BIN_TOP_Y,
    FLOOR_Y,
    SEP_XS,
    BIN_CENTERS,
    VALUES,
    BINS,
    JACKPOT,
    SUBS,
    createBall,
    step,
    type SimWorld
  } from '$lib/tools/gingado/physics';
  import type { Ball, EditMode, PenIndex, Bar } from '$lib/tools/gingado/types';
  import { GINGADO_SLIDES } from '$lib/tools/gingado/tutorial';
  import '$lib/tools/gingado/tutorial.css';

  const DEG = Math.PI / 180;
  const ACCENT = '#93d4ff';
  const GOLD = '#ffd166';

  // ---- canvas ----
  let cv = $state<HTMLCanvasElement | null>(null);
  let ctx: CanvasRenderingContext2D | null = null;
  let DPR = 1;
  let S = 1; // logical → device-pixel scale
  const sx = (v: number) => v * S;

  let animating = $state(false);

  // ---- editing ----
  type DragTarget =
    | { kind: 'pen'; obj: { x: number }; i: PenIndex }
    | { kind: 'xy'; obj: { x: number; y: number } }
    | { kind: 'barEnd'; obj: Bar; e: 1 | 2 };
  let drag: DragTarget | null = null;

  // ---- modals ----
  let tourOpen = $state(false);
  let dataOpen = $state(false);
  let dataText = $state('');

  const penNames = $derived([
    i18n.m.gingado.penLeft,
    i18n.m.gingado.penMiddle,
    i18n.m.gingado.penRight
  ]);

  const EDIT_MODES: { mode: EditMode; icon: IconName; label: () => string }[] = [
    { mode: 'drag', icon: 'move', label: () => i18n.m.gingado.modeDrag },
    { mode: 'addPin', icon: 'circle-dot', label: () => i18n.m.gingado.modePin },
    { mode: 'addBar', icon: 'slash', label: () => i18n.m.gingado.modeBar },
    { mode: 'addBump', icon: 'circle', label: () => i18n.m.gingado.modeBump },
    { mode: 'del', icon: 'trash-2', label: () => i18n.m.gingado.modeDel }
  ];

  // ---- number formatting ----
  function fmt1(n: number): string {
    return n.toLocaleString(i18n.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  function fmt2(n: number): string {
    return n.toLocaleString(i18n.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtInt(n: number): string {
    return Math.round(n).toLocaleString(i18n.locale);
  }

  // ================= rendering =================
  function resize() {
    if (!cv) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || 360;
    const h = Math.round((w * LH) / LW);
    cv.style.height = h + 'px';
    cv.width = Math.round(w * DPR);
    cv.height = Math.round(h * DPR);
    S = cv.width / LW;
    draw();
  }

  function rr(x: number, y: number, w: number, h: number, r: number) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(ball?: Ball) {
    if (!cv) return;
    // Lazily grab the context so the redraw effect (which may run before
    // onMount) still reads — and therefore tracks — every store value below.
    if (!ctx) ctx = cv.getContext('2d');
    if (!ctx) return;
    const c = ctx;
    const { pins, bumpers, bars, penguins } = gingado.layout;
    const counts = gingado.simCounts;
    const sel = gingado.selPen;
    const aim = gingado.launch.aimDeg * DEG;
    const sw = gingado.launch.swDeg * DEG;

    c.clearRect(0, 0, cv.width, cv.height);

    // board background
    const g = c.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, '#141a30');
    g.addColorStop(1, '#0b0e1a');
    c.fillStyle = g;
    rr(0, 0, cv.width, cv.height, 14 * DPR);
    c.fill();

    // side walls
    c.strokeStyle = 'rgba(147,212,255,0.20)';
    c.lineWidth = 2 * DPR;
    c.beginPath();
    c.moveTo(sx(6), sx(10));
    c.lineTo(sx(6), sx(BIN_TOP_Y));
    c.moveTo(sx(LW - 6), sx(10));
    c.lineTo(sx(LW - 6), sx(BIN_TOP_Y));
    c.stroke();

    // bars (tilted shards) + draggable endpoints
    c.lineCap = 'round';
    for (const b of bars) {
      c.lineWidth = b.r * 2 * S;
      c.strokeStyle = 'rgba(147,212,255,0.5)';
      c.beginPath();
      c.moveTo(sx(b.x1), sx(b.y1));
      c.lineTo(sx(b.x2), sx(b.y2));
      c.stroke();
      c.lineWidth = b.r * S;
      c.strokeStyle = 'rgba(220,240,255,0.45)';
      c.beginPath();
      c.moveTo(sx(b.x1), sx(b.y1));
      c.lineTo(sx(b.x2), sx(b.y2));
      c.stroke();
      for (const [hx, hy] of [
        [b.x1, b.y1],
        [b.x2, b.y2]
      ] as const) {
        c.beginPath();
        c.arc(sx(hx), sx(hy), 3.5 * DPR, 0, 7);
        c.fillStyle = ACCENT;
        c.fill();
      }
    }

    // pins
    for (const p of pins) {
      c.beginPath();
      c.arc(sx(p.x), sx(p.y), p.r * S, 0, 7);
      c.fillStyle = 'rgba(205,233,255,0.7)';
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.22)';
      c.lineWidth = 1 * DPR;
      c.stroke();
    }

    // resource bubbles (bumpers)
    for (const b of bumpers) {
      const x = sx(b.x);
      const y = sx(b.y);
      const r = b.r * S;
      const rg = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
      rg.addColorStop(0, '#ffe9c2');
      rg.addColorStop(1, GOLD);
      c.beginPath();
      c.arc(x, y, r, 0, 7);
      c.fillStyle = rg;
      c.fill();
      c.lineWidth = 2.5 * DPR;
      c.strokeStyle = 'rgba(110,231,168,0.7)';
      c.stroke();
    }

    // pots
    for (let i = 0; i < BINS; i++) {
      const cx = sx(BIN_CENTERS[i]);
      const bw = (SEP_XS[i + 1] - SEP_XS[i]) * S * 0.96;
      const x = cx - bw / 2;
      const y = sx(BIN_TOP_Y);
      const hh = sx(FLOOR_Y) - y;
      const jp = i === JACKPOT;
      c.fillStyle = jp ? 'rgba(255,209,102,0.16)' : 'rgba(147,212,255,0.08)';
      rr(x, y, bw, hh, 7 * DPR);
      c.fill();
      c.strokeStyle = jp ? 'rgba(255,209,102,0.5)' : 'rgba(147,212,255,0.25)';
      c.lineWidth = 1.5 * DPR;
      c.stroke();
      c.fillStyle = jp ? '#ffe1a3' : '#cdeaff';
      c.font = `700 ${13 * DPR}px 'DM Mono', monospace`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(String(VALUES[i]), cx, y + hh * 0.4);
      if (counts[i] > 0) {
        c.fillStyle = 'rgba(255,255,255,0.5)';
        c.font = `${9 * DPR}px 'DM Mono', monospace`;
        c.fillText(counts[i] + '×', cx, y + hh * 0.78);
      }
    }

    // dividers (tall walls)
    c.strokeStyle = 'rgba(190,225,255,0.5)';
    c.lineWidth = 2.5 * DPR;
    for (const s of SEP_XS) {
      c.beginPath();
      c.moveTo(sx(s), sx(BIN_TOP_Y));
      c.lineTo(sx(s), sx(FLOOR_Y));
      c.stroke();
    }

    // penguins + launch fan for the selected one
    for (let i = 0; i < penguins.length; i++) {
      const x = sx(penguins[i].x);
      const y = sx(12);
      if (i === sel) {
        c.beginPath();
        c.arc(x, y - 9 * DPR, 15 * DPR, 0, 7);
        c.fillStyle = 'rgba(147,212,255,0.22)';
        c.fill();
        c.strokeStyle = 'rgba(147,212,255,0.9)';
        c.lineWidth = 2 * DPR;
        c.stroke();
        const len = sx(BIN_TOP_Y - 20);
        const a1 = aim - sw;
        const a2 = aim + sw;
        c.fillStyle = 'rgba(147,212,255,0.10)';
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + Math.sin(a1) * len, y + Math.cos(a1) * len);
        c.lineTo(x + Math.sin(a2) * len, y + Math.cos(a2) * len);
        c.closePath();
        c.fill();
        c.setLineDash([4 * DPR, 5 * DPR]);
        c.strokeStyle = 'rgba(147,212,255,0.35)';
        c.lineWidth = 1.5 * DPR;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + Math.sin(aim) * len, y + Math.cos(aim) * len);
        c.stroke();
        c.setLineDash([]);
      }
      c.font = `${17 * DPR}px serif`;
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText('🐧', x, y);
    }

    // ball
    if (ball) {
      const x = sx(ball.x);
      const y = sx(ball.y);
      const r = BALL_R * S;
      const rg = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(1, ACCENT);
      c.beginPath();
      c.arc(x, y, r, 0, 7);
      c.fillStyle = rg;
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 1.4 * DPR;
      c.stroke();
    }
  }

  // draw() reads the layout, selection, sim counts and launch angle from the
  // store, so this effect tracks all of them and redraws whenever any change —
  // including live edits (drag/add/remove mutate the reactive layout). The
  // edit/animation handlers also call draw() directly for immediate feedback.
  $effect(() => {
    draw();
  });

  // ================= animated single drop =================
  function dropOne() {
    if (animating || gingado.busy) return;
    animating = true;
    const world: SimWorld = gingado.world;
    const b = createBall(world, gingado.penX(gingado.selPen));
    const frame = () => {
      for (let s = 0; s < SUBS && !b.done; s++) step(world, b);
      draw(b);
      if (!b.done) {
        requestAnimationFrame(frame);
      } else {
        animating = false;
        gingado.recordDrop(b.bin, b.hits);
        setTimeout(() => draw(), 200);
      }
    };
    requestAnimationFrame(frame);
  }

  async function simulate() {
    await gingado.simulateMany(SIM_N);
  }
  async function compare() {
    await gingado.compareAll(COMPARE_N);
  }

  // ================= pointer editing =================
  function pt(e: PointerEvent): { x: number; y: number } {
    const r = cv!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * LW,
      y: ((e.clientY - r.top) / r.height) * LH
    };
  }
  function near(ax: number, ay: number, x: number, y: number, rad: number): boolean {
    return Math.hypot(ax - x, ay - y) < rad;
  }
  function pick(p: { x: number; y: number }): DragTarget | null {
    const { pins, bumpers, bars, penguins } = gingado.layout;
    for (const b of bars) {
      if (near(b.x1, b.y1, p.x, p.y, 16)) return { kind: 'barEnd', obj: b, e: 1 };
      if (near(b.x2, b.y2, p.x, p.y, 16)) return { kind: 'barEnd', obj: b, e: 2 };
    }
    for (const b of bumpers) if (near(b.x, b.y, p.x, p.y, b.r + 6)) return { kind: 'xy', obj: b };
    for (const p2 of pins)
      if (near(p2.x, p2.y, p.x, p.y, p2.r + 10)) return { kind: 'xy', obj: p2 };
    for (let i = 0; i < penguins.length; i++) {
      if (near(penguins[i].x, 12, p.x, p.y, 20))
        return { kind: 'pen', obj: penguins[i], i: i as PenIndex };
    }
    return null;
  }
  function delAt(p: { x: number; y: number }): boolean {
    const { pins, bumpers, bars } = gingado.layout;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const abx = b.x2 - b.x1;
      const aby = b.y2 - b.y1;
      const L2 = abx * abx + aby * aby || 1;
      let t = ((p.x - b.x1) * abx + (p.y - b.y1) * aby) / L2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      if (Math.hypot(b.x1 + t * abx - p.x, b.y1 + t * aby - p.y) < b.r + 8) {
        gingado.removeBar(i);
        return true;
      }
    }
    for (let i = 0; i < bumpers.length; i++)
      if (near(bumpers[i].x, bumpers[i].y, p.x, p.y, bumpers[i].r)) {
        gingado.removeBumper(i);
        return true;
      }
    for (let i = 0; i < pins.length; i++)
      if (near(pins[i].x, pins[i].y, p.x, p.y, pins[i].r + 8)) {
        gingado.removePin(i);
        return true;
      }
    return false;
  }

  const clampX = (v: number) => Math.max(8, Math.min(LW - 8, v));
  const clampY = (v: number) => Math.max(18, Math.min(BIN_TOP_Y - 8, v));

  function onPointerDown(e: PointerEvent) {
    if (!cv) return;
    const p = pt(e);
    const m = gingado.mode;
    if (m === 'addPin') {
      gingado.addPin(clampX(p.x), clampY(p.y));
      draw();
      return;
    }
    if (m === 'addBump') {
      gingado.addBumper(clampX(p.x), clampY(p.y));
      draw();
      return;
    }
    if (m === 'addBar') {
      gingado.addBar(clampX(p.x), clampY(p.y));
      draw();
      return;
    }
    if (m === 'del') {
      if (delAt(p)) draw();
      return;
    }
    const hit = pick(p);
    if (hit) {
      drag = hit;
      if (hit.kind === 'pen') gingado.setSelPen(hit.i);
      // Document-level listeners (no pointer capture — see utils/drag.ts).
      document.addEventListener('pointermove', onPointerMove, { passive: false });
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
    }
  }
  function onPointerMove(e: PointerEvent) {
    if (!drag) return;
    e.preventDefault();
    const p = pt(e);
    if (drag.kind === 'pen') {
      drag.obj.x = Math.max(14, Math.min(LW - 14, p.x));
    } else if (drag.kind === 'xy') {
      drag.obj.x = clampX(p.x);
      drag.obj.y = clampY(p.y);
    } else if (drag.e === 1) {
      drag.obj.x1 = clampX(p.x);
      drag.obj.y1 = clampY(p.y);
    } else {
      drag.obj.x2 = clampX(p.x);
      drag.obj.y2 = clampY(p.y);
    }
    draw();
  }
  function onPointerUp() {
    drag = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
  }

  // ================= layout persistence =================
  function onSave() {
    const ok = gingado.saveLayout();
    snackbar.show(ok ? i18n.m.gingado.saved : i18n.m.gingado.saveFailed, ok ? 'ok' : 'no');
  }
  function onLoad() {
    const r = gingado.loadLayout();
    if (r === 'ok') {
      snackbar.show(i18n.m.gingado.loaded, 'ok');
      draw();
    } else if (r === 'none') snackbar.show(i18n.m.gingado.loadNone, 'no');
    else snackbar.show(i18n.m.gingado.loadFailed, 'no');
  }
  function onDefault() {
    gingado.resetToDefault();
    snackbar.show(i18n.m.gingado.defaulted, 'ok');
    draw();
  }
  function openData() {
    dataText = gingado.exportJson();
    dataOpen = true;
  }
  async function copyData() {
    const ok = await copyText(dataText);
    snackbar.show(ok ? i18n.m.gingado.copied : i18n.m.gingado.copyFailed, ok ? 'ok' : 'no');
  }
  function applyData() {
    if (gingado.importJson(dataText)) {
      snackbar.show(i18n.m.gingado.imported, 'ok');
      dataOpen = false;
      draw();
    } else {
      snackbar.show(i18n.m.gingado.importFailed, 'no');
    }
  }

  function closeTour() {
    tourOpen = false;
    gingado.markTourSeen();
  }

  onMount(() => {
    ctx = cv?.getContext('2d') ?? null;
    resize();
    const ro = new ResizeObserver(() => resize());
    if (cv) ro.observe(cv);
    window.addEventListener('resize', resize);
    if (!gingado.hasSeenTour()) tourOpen = true;
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  });

  // ---- derived stats ----
  const stat = $derived(gingado.simStat);
  const histMax = $derived(Math.max(1, ...gingado.simCounts));
  const realStat = $derived(gingado.realStat);
  const best = $derived(gingado.bestPen);
</script>

<svelte:head>
  <title>{i18n.m.gingado.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

<main class="page">
  <PageHeader title={i18n.m.gingado.title} sub={i18n.m.gingado.sub}>
    {#snippet actions()}
      <button
        class="ibtn"
        aria-label={i18n.m.common.reset}
        title={i18n.m.common.reset}
        onclick={() => gingado.clearSim()}
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

  <div class="work">
    <div class="col col-board">
      <!-- BOARD -->
      <section class="panel">
        <div class="board-wrap">
          <canvas
            bind:this={cv}
            class="board"
            aria-label={i18n.m.gingado.boardEyebrow}
            onpointerdown={onPointerDown}
          ></canvas>
        </div>

        <!-- penguin selector -->
        <div class="pensel" role="group" aria-label={i18n.m.gingado.compareEyebrow}>
          {#each penNames as name, i (i)}
            <button
              class="pbtn"
              class:active={gingado.selPen === i}
              aria-pressed={gingado.selPen === i}
              onclick={() => gingado.setSelPen(i as PenIndex)}
            >
              🐧 {name}
              <small>{gingado.compare ? 'EV ' + fmtInt(gingado.compare[i].ev) : '—'}</small>
            </button>
          {/each}
        </div>

        <!-- edit toolbar -->
        <div class="editbar" role="group" aria-label="edit">
          {#each EDIT_MODES as m (m.mode)}
            <button
              class="chip"
              class:active={gingado.mode === m.mode}
              aria-pressed={gingado.mode === m.mode}
              onclick={() => gingado.setMode(m.mode)}
            >
              <Icon name={m.icon} size={13} />
              {m.label()}
            </button>
          {/each}
          <p class="edit-note">{i18n.m.gingado.editNote}</p>
        </div>

        <!-- stats -->
        <div class="evbar">
          <div class="stat">
            <div class="stat-lbl">{i18n.m.gingado.statBalls}</div>
            <div class="stat-val">{fmtInt(gingado.simN)}</div>
          </div>
          <div class="stat">
            <div class="stat-lbl">{i18n.m.gingado.statAvg}</div>
            <div class="stat-val gold">{gingado.simN ? fmt1(stat.ev) : '—'}</div>
          </div>
          <div class="stat">
            <div class="stat-lbl">{i18n.m.gingado.statHits}</div>
            <div class="stat-val res">{gingado.simN ? fmt1(stat.hits) : '—'}</div>
          </div>
        </div>

        <!-- actions -->
        <div class="btns">
          <button class="act primary" disabled={animating || gingado.busy} onclick={dropOne}>
            <Icon name="play" size={14} />
            {i18n.m.gingado.dropOne}
          </button>
          <button class="act gold" disabled={gingado.busy} onclick={simulate}>
            <Icon name="zap" size={14} />
            {fmt(i18n.m.gingado.simulate, { n: fmtInt(SIM_N) })}
          </button>
          <button class="act ghost" disabled={gingado.busy} onclick={() => gingado.clearSim()}>
            {i18n.m.common.reset}
          </button>
        </div>
        {#if gingado.busy}
          <div class="progress-row">
            <div class="progress" aria-live="polite">
              <div class="progress-bar" style="width: {gingado.progress * 100}%"></div>
              <span class="progress-lbl"
                >{i18n.m.gingado.simulating}
                {Math.round(gingado.progress * 100)}%</span
              >
            </div>
            <button
              class="cancel-btn"
              aria-label={i18n.m.gingado.cancel}
              title={i18n.m.gingado.cancel}
              onclick={() => gingado.cancelBatch()}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        {/if}

        <!-- layout persistence -->
        <div class="btns mini">
          <button class="act ghost" onclick={onSave}
            ><Icon name="download" size={13} /> {i18n.m.gingado.save}</button
          >
          <button class="act ghost" onclick={onLoad}
            ><Icon name="upload" size={13} /> {i18n.m.gingado.load}</button
          >
          <button class="act ghost" onclick={onDefault}
            ><Icon name="rotate-ccw" size={13} /> {i18n.m.gingado.default}</button
          >
          <button class="act ghost" onclick={openData}
            ><Icon name="copy" size={13} /> {i18n.m.gingado.data}</button
          >
        </div>
      </section>
    </div>

    <div class="col col-side">
      <!-- COMPARE -->
      <section class="panel">
        <div class="panel-bar"><span class="eyebrow">{i18n.m.gingado.compareEyebrow}</span></div>
        <div class="cmp">
          {#each penNames as name, i (i)}
            <div class="cmpcard" class:best={best === i && gingado.compare}>
              {#if best === i && gingado.compare}
                <span class="crown" aria-hidden="true"><Icon name="crown" size={16} /></span>
              {/if}
              <div class="cmp-pn">{name}</div>
              <div class="cmp-ev">{gingado.compare ? fmt1(gingado.compare[i].ev) : '—'}</div>
              <div class="cmp-sub">
                {#if gingado.compare}
                  500: {fmt1(gingado.compare[i].jp)}% · {fmt1(gingado.compare[i].hits)}×
                {/if}
              </div>
            </div>
          {/each}
        </div>
        {#if gingado.compare && best >= 0}
          <p class="reco">
            {fmt(i18n.m.gingado.best, {
              name: penNames[best],
              ev: fmt1(gingado.compare[best].ev)
            })}
          </p>
        {:else}
          <p class="hint">{i18n.m.gingado.compareHint}</p>
        {/if}
        <div class="btns">
          <button class="act gold" disabled={gingado.busy} onclick={compare}>
            <Icon name="crown" size={14} />
            {fmt(i18n.m.gingado.compareRun, { n: fmtInt(COMPARE_N) })}
          </button>
        </div>
      </section>

      <!-- DISTRIBUTION -->
      <section class="panel">
        <div class="panel-bar"><span class="eyebrow">{i18n.m.gingado.distEyebrow}</span></div>
        <div class="dist">
          {#each VALUES as v, i (i)}
            {@const pct = gingado.simN ? (gingado.simCounts[i] / gingado.simN) * 100 : 0}
            <div class="dline" class:jp={i === JACKPOT}>
              <div class="bin">{v}</div>
              <div class="track">
                <div class="fill" style="width: {(gingado.simCounts[i] / histMax) * 100}%"></div>
              </div>
              <div class="pct"><b>{fmt1(pct)}%</b> · {gingado.simCounts[i]}</div>
            </div>
          {/each}
        </div>
        <p class="hint">
          {#if gingado.simN >= 50}
            {fmt(i18n.m.gingado.distHint, {
              name: penNames[gingado.selPen],
              n: fmtInt(gingado.simN),
              jp: fmt1(stat.jp),
              hits: fmt1(stat.hits)
            })}
          {:else}
            {i18n.m.gingado.distHintEmpty}
          {/if}
        </p>
      </section>
    </div>
  </div>

  <!-- LAUNCH -->
  <section class="panel">
    <div class="panel-bar"><span class="eyebrow">{i18n.m.gingado.launchEyebrow}</span></div>
    <div class="grid2">
      <div class="ctrl">
        <label for="g-pow">{i18n.m.gingado.power}<span class="v">{gingado.launch.pow}</span></label>
        <input
          id="g-pow"
          type="range"
          min={RANGES.pow.min}
          max={RANGES.pow.max}
          step={RANGES.pow.step}
          value={gingado.launch.pow}
          oninput={(e) => gingado.setPow(+e.currentTarget.value)}
        />
      </div>
      <div class="ctrl">
        <label for="g-aim"
          >{i18n.m.gingado.aim}<span class="v">{gingado.launch.aimDeg}°</span></label
        >
        <input
          id="g-aim"
          type="range"
          min={RANGES.aimDeg.min}
          max={RANGES.aimDeg.max}
          step={RANGES.aimDeg.step}
          value={gingado.launch.aimDeg}
          oninput={(e) => gingado.setAimDeg(+e.currentTarget.value)}
        />
      </div>
      <div class="ctrl wide">
        <label for="g-sw"
          >{i18n.m.gingado.spread}<span class="v">±{gingado.launch.swDeg}°</span></label
        >
        <input
          id="g-sw"
          type="range"
          min={RANGES.swDeg.min}
          max={RANGES.swDeg.max}
          step={RANGES.swDeg.step}
          value={gingado.launch.swDeg}
          oninput={(e) => gingado.setSwDeg(+e.currentTarget.value)}
        />
      </div>
    </div>
    <div class="seg" role="group" aria-label={i18n.m.gingado.angleBias}>
      <span class="seg-lbl">{i18n.m.gingado.angleBias}</span>
      <div class="seg-btns">
        <button
          class="seg-btn"
          class:active={gingado.launch.angleMode === 'uniform'}
          aria-pressed={gingado.launch.angleMode === 'uniform'}
          onclick={() => gingado.setAngleMode('uniform')}>{i18n.m.gingado.angleUniform}</button
        >
        <button
          class="seg-btn"
          class:active={gingado.launch.angleMode === 'edges'}
          aria-pressed={gingado.launch.angleMode === 'edges'}
          onclick={() => gingado.setAngleMode('edges')}>{i18n.m.gingado.angleEdges}</button
        >
      </div>
    </div>
    <p class="hint">{i18n.m.gingado.launchHint}</p>
  </section>

  <!-- PHYSICS -->
  <section class="panel">
    <div class="panel-bar"><span class="eyebrow">{i18n.m.gingado.physicsEyebrow}</span></div>
    <div class="grid2">
      <div class="ctrl">
        <label for="g-rest"
          >{i18n.m.gingado.rest}<span class="v">{fmt2(gingado.physics.rest)}</span></label
        >
        <input
          id="g-rest"
          type="range"
          min={RANGES.rest.min}
          max={RANGES.rest.max}
          step={RANGES.rest.step}
          value={gingado.physics.rest}
          oninput={(e) => gingado.setRest(+e.currentTarget.value)}
        />
      </div>
      <div class="ctrl">
        <label for="g-kick"
          >{i18n.m.gingado.kick}<span class="v">{fmt1(gingado.physics.kick)}</span></label
        >
        <input
          id="g-kick"
          type="range"
          min={RANGES.kick.min}
          max={RANGES.kick.max}
          step={RANGES.kick.step}
          value={gingado.physics.kick}
          oninput={(e) => gingado.setKick(+e.currentTarget.value)}
        />
      </div>
      <div class="ctrl wide">
        <label for="g-grav"
          >{i18n.m.gingado.grav}<span class="v">{fmt1(gingado.physics.grav)}</span></label
        >
        <input
          id="g-grav"
          type="range"
          min={RANGES.grav.min}
          max={RANGES.grav.max}
          step={RANGES.grav.step}
          value={gingado.physics.grav}
          oninput={(e) => gingado.setGrav(+e.currentTarget.value)}
        />
      </div>
    </div>
    <p class="warn">{i18n.m.gingado.warn}</p>
  </section>

  <!-- REAL LOG -->
  <section class="panel">
    <div class="panel-bar">
      <span class="eyebrow">{i18n.m.gingado.realEyebrow}</span>
      {#if gingado.realN > 0}
        <button
          class="ibtn-sm"
          aria-label={i18n.m.gingado.realClear}
          title={i18n.m.gingado.realClear}
          onclick={() => gingado.clearReal()}
        >
          <Icon name="trash-2" size={13} />
        </button>
      {/if}
    </div>
    <p class="hint">{i18n.m.gingado.realIntro}</p>
    <div class="real-grid">
      {#each VALUES as v, i (i)}
        <button class="real-btn" class:jp={i === JACKPOT} onclick={() => gingado.addReal(i)}>
          <span class="real-v">{v}</span>
          <span class="real-c">{gingado.realCounts[i]}×</span>
        </button>
      {/each}
    </div>
    <div class="evbar">
      <div class="stat">
        <div class="stat-lbl">{i18n.m.gingado.realLogged}</div>
        <div class="stat-val">{fmtInt(gingado.realN)}</div>
      </div>
      <div class="stat">
        <div class="stat-lbl">{i18n.m.gingado.realAvg}</div>
        <div class="stat-val gold">{gingado.realN ? fmt1(realStat.ev) : '—'}</div>
      </div>
      <div class="stat">
        <div class="stat-lbl">{i18n.m.gingado.simAvg}</div>
        <div class="stat-val">{gingado.simN ? fmt1(stat.ev) : '—'}</div>
      </div>
    </div>
  </section>
</main>

<Modal open={dataOpen} onClose={() => (dataOpen = false)} label={i18n.m.gingado.dataTitle}>
  <h2 class="picker-title">{i18n.m.gingado.dataTitle}</h2>
  <p class="hint">{i18n.m.gingado.dataHint}</p>
  <textarea class="data-area" bind:value={dataText} spellcheck="false" rows="10"></textarea>
  <div class="btns">
    <button class="act ghost" onclick={copyData}
      ><Icon name="copy" size={13} /> {i18n.m.gingado.copy}</button
    >
    <button class="act primary" onclick={applyData}>{i18n.m.gingado.apply}</button>
  </div>
</Modal>

<Tutorial
  open={tourOpen}
  onClose={closeTour}
  slides={[
    {
      title: i18n.m.gingado.tour.welcomeTitle,
      caption: i18n.m.gingado.tour.welcomeCaption,
      svg: GINGADO_SLIDES[0].svg()
    },
    {
      title: i18n.m.gingado.tour.wobbleTitle,
      caption: i18n.m.gingado.tour.wobbleCaption,
      svg: GINGADO_SLIDES[1].svg()
    },
    {
      title: i18n.m.gingado.tour.editTitle,
      caption: i18n.m.gingado.tour.editCaption,
      svg: GINGADO_SLIDES[2].svg()
    },
    {
      title: i18n.m.gingado.tour.simTitle,
      caption: i18n.m.gingado.tour.simCaption,
      svg: GINGADO_SLIDES[3].svg()
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
  .ibtn-sm:hover {
    background: var(--surface-hover);
    color: var(--text);
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

  /* two-column on desktop */
  .work {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .work {
      grid-template-columns: 1fr 0.92fr;
      gap: 24px;
      align-items: start;
    }
    .col-board {
      position: sticky;
      top: 24px;
    }
  }

  /* board */
  .board-wrap {
    margin: -2px 0 12px;
  }
  .board {
    display: block;
    width: 100%;
    border-radius: 14px;
    touch-action: none;
  }

  .pensel {
    display: flex;
    gap: 8px;
  }
  .pbtn {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.5px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-mid);
    border-radius: var(--r-button);
    padding: 9px 4px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
  }
  .pbtn:hover {
    border-color: var(--border-strong);
    color: var(--text);
  }
  .pbtn.active {
    background: var(--accent-glow);
    border-color: var(--border-accent);
    color: var(--text);
  }
  .pbtn small {
    display: block;
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--text-dim);
    margin-top: 3px;
  }

  .editbar {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.5px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-mid);
    border-radius: var(--r-pill);
    padding: 7px 11px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .chip:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }
  .chip.active {
    background: var(--accent-glow);
    border-color: var(--border-accent);
    color: var(--text);
  }
  .edit-note {
    flex-basis: 100%;
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.55;
    color: var(--text-dim);
    margin: 4px 0 0;
  }

  /* stat bar */
  .evbar {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    flex-wrap: wrap;
  }
  .stat {
    flex: 1;
    min-width: 92px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-button);
    padding: 10px 12px;
  }
  .stat-lbl {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .stat-val {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 800;
    font-size: 26px;
    line-height: 1.1;
    margin-top: 2px;
    color: var(--accent);
  }
  .stat-val.gold {
    color: var(--pin-6);
  }
  .stat-val.res {
    color: var(--ok);
  }

  /* action buttons */
  .btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
  }
  .btns.mini {
    margin-top: 8px;
  }
  .act {
    flex: 1;
    min-width: 92px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    border-radius: var(--r-button);
    padding: 11px 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: all 0.2s ease;
  }
  .act:hover:not(:disabled) {
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  .act:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .act.primary {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
  }
  .act.primary:hover:not(:disabled) {
    filter: brightness(1.05);
    background: var(--accent);
  }
  .act.gold {
    background: var(--pin-6);
    color: #2a2000;
    border-color: var(--pin-6);
  }
  .act.gold:hover:not(:disabled) {
    filter: brightness(1.06);
    background: var(--pin-6);
  }
  .act.ghost {
    flex: 1 1 auto;
    font-size: 10px;
    color: var(--text-mid);
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
  .progress {
    position: relative;
    flex: 1;
    height: 30px;
    border-radius: var(--r-pill);
    background: rgba(255, 255, 255, 0.05);
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .cancel-btn {
    flex: none;
    width: 30px;
    height: 30px;
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
  .cancel-btn:hover {
    color: var(--no);
    border-color: var(--no-glow-strong);
  }
  .progress-bar {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(90deg, var(--accent-glow-strong), var(--accent));
    transition: width 0.1s linear;
  }
  .progress-lbl {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text);
  }

  /* compare */
  .cmp {
    display: flex;
    gap: 8px;
  }
  .cmpcard {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-button);
    padding: 12px 8px;
    text-align: center;
    position: relative;
  }
  .cmpcard.best {
    border-color: rgba(110, 231, 168, 0.6);
    box-shadow: 0 0 0 1px rgba(110, 231, 168, 0.5);
  }
  .crown {
    position: absolute;
    top: -10px;
    inset-inline-end: -6px;
    color: var(--ok);
  }
  .cmp-pn {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.5px;
    color: var(--text-mid);
  }
  .cmp-ev {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 800;
    font-size: 24px;
    color: var(--pin-6);
    margin: 4px 0 2px;
  }
  .cmp-sub {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-dim);
    min-height: 12px;
  }
  .reco {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 600;
    font-size: 14px;
    color: var(--ok);
    text-align: center;
    margin: 12px 0 0;
  }

  .hint {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--text-mid);
    margin: 12px 0 0;
  }
  .warn {
    font-family: var(--font-mono);
    font-size: 10.5px;
    line-height: 1.6;
    color: #ffce8a;
    background: rgba(255, 209, 102, 0.07);
    border: 1px solid rgba(255, 209, 102, 0.22);
    border-radius: var(--r-button);
    padding: 11px 13px;
    margin: 14px 0 0;
  }

  /* distribution */
  .dist {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .dline {
    display: grid;
    grid-template-columns: 44px 1fr 96px;
    align-items: center;
    gap: 10px;
  }
  .dline .bin {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 13px;
    text-align: end;
    color: var(--text-mid);
  }
  .dline.jp .bin {
    color: var(--pin-6);
  }
  .track {
    height: 22px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 7px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-glow-strong), var(--accent));
    border-radius: 7px;
    transition: width 0.4s ease;
  }
  .dline.jp .fill {
    background: linear-gradient(90deg, #e0a83c, var(--pin-6));
  }
  .dline .pct {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    text-align: end;
  }
  .dline .pct b {
    color: var(--text);
    font-weight: 500;
  }

  /* launch / physics controls */
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .ctrl.wide {
    grid-column: 1 / -1;
  }
  .ctrl label {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  .ctrl label .v {
    color: var(--accent);
  }
  input[type='range'] {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    height: 5px;
    border-radius: var(--r-pill);
    background: rgba(255, 255, 255, 0.12);
    outline: none;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--bg-soft);
    cursor: pointer;
    box-shadow: 0 0 8px var(--accent-glow-strong);
  }
  input[type='range']::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--bg-soft);
    cursor: pointer;
  }

  .seg {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .seg-lbl {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
    letter-spacing: 0.5px;
  }
  .seg-btns {
    display: inline-flex;
    gap: 6px;
  }
  .seg-btn {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.5px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-mid);
    border-radius: var(--r-pill);
    padding: 7px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .seg-btn:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }
  .seg-btn.active {
    background: var(--accent-glow);
    border-color: var(--border-accent);
    color: var(--text);
  }

  /* real log */
  .real-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    margin-top: 14px;
  }
  @media (max-width: 540px) {
    .real-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    .stat-val,
    .cmp-ev {
      font-size: 21px;
    }
  }
  .real-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-button);
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .real-btn:hover {
    border-color: var(--border-accent);
    background: var(--accent-glow);
    transform: translateY(-2px);
  }
  .real-btn.jp {
    border-color: rgba(255, 209, 102, 0.35);
  }
  .real-v {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 13px;
  }
  .real-btn.jp .real-v {
    color: var(--pin-6);
  }
  .real-c {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
  }

  /* data modal */
  .picker-title {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 20px;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .data-area {
    width: 100%;
    margin-top: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    padding: 10px 12px;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    outline: none;
    resize: vertical;
  }
  .data-area:focus {
    border-color: var(--border-accent);
  }
</style>
