/** Gingado do Pinguim — reactive store (Svelte 5 runes).
 *
 * Holds the editable layout, the physics/launch knobs, the running simulation
 * tallies, the 3-penguin comparison, and the manual "real log" used to
 * calibrate the model against the actual game. Mass simulation runs in chunks
 * (yielding to the event loop) so a 2,000-ball run never freezes the UI. */

import { readJson, writeJson, readString, writeString } from '$lib/utils/storage';
import { BINS, JACKPOT, VALUES, makeWorld, summarize, type SimWorld } from './physics';
import type {
  AngleMode,
  BatchStat,
  EditMode,
  Layout,
  PenIndex,
  PhysicsParams,
  LaunchParams
} from './types';
import type { SimParams, WorkerResponse } from './sim.worker';

export { BINS, JACKPOT, VALUES };

export const PEN_COUNT = 3;

export const DEFAULT_PHYSICS: PhysicsParams = { rest: 0.65, kick: 3.0, grav: 1.0 };

// The real game's ball almost always exits crooked, rarely straight — so the
// default opens the angle wide (±30°) and biases the sample toward the edges.
export const DEFAULT_LAUNCH: LaunchParams = {
  pow: 35,
  aimDeg: 0,
  swDeg: 30,
  angleMode: 'edges'
};

/** Slider ranges, kept here so the UI and the defaults agree. */
export const RANGES = {
  pow: { min: 0, max: 120, step: 1 },
  aimDeg: { min: -30, max: 30, step: 1 },
  swDeg: { min: 0, max: 60, step: 1 },
  rest: { min: 0.2, max: 0.92, step: 0.01 },
  kick: { min: 0, max: 8, step: 0.1 },
  grav: { min: 0.4, max: 2, step: 0.05 }
} as const;

/** Default sample sizes. */
export const SIM_N = 2000;
export const COMPARE_N = 1500;

const LAYOUT_KEY = 'gingado-layout-v1';
const REAL_KEY = 'gingado-real-v1';
const TOUR_KEY = 'gingado-tour-seen';

/** The full-field default board, calibrated from in-game screenshots (logical
 * 360×470 space). */
export function defaultLayout(): Layout {
  return {
    penguins: [{ x: 360 * 0.11 }, { x: 360 * 0.5 }, { x: 360 * 0.89 }],
    bumpers: [
      { x: 97, y: 298, r: 33 },
      { x: 268, y: 298, r: 33 }
    ],
    bars: [
      { x1: 108, y1: 186, x2: 150, y2: 176, r: 6 },
      { x1: 220, y1: 178, x2: 262, y2: 190, r: 6 }
    ],
    pins: [
      { x: 182, y: 196, r: 11 },
      { x: 25, y: 122, r: 6 },
      { x: 116, y: 126, r: 6 },
      { x: 168, y: 124, r: 6 },
      { x: 244, y: 127, r: 6 },
      { x: 321, y: 122, r: 6 },
      { x: 58, y: 159, r: 5 },
      { x: 292, y: 155, r: 5 },
      { x: 82, y: 230, r: 5 },
      { x: 173, y: 225, r: 5 },
      { x: 283, y: 230, r: 5 },
      { x: 20, y: 275, r: 5 },
      { x: 168, y: 279, r: 5 },
      { x: 335, y: 271, r: 5 },
      { x: 25, y: 343, r: 5 },
      { x: 163, y: 343, r: 5 },
      { x: 206, y: 350, r: 5 },
      { x: 321, y: 346, r: 5 },
      { x: 82, y: 371, r: 5 },
      { x: 263, y: 367, r: 5 },
      { x: 311, y: 375, r: 5 }
    ]
  };
}

interface StoredLayout {
  layout: Layout;
  physics: PhysicsParams;
  launch: LaunchParams;
}

interface GingadoState {
  layout: Layout;
  physics: PhysicsParams;
  launch: LaunchParams;
  selPen: PenIndex;
  mode: EditMode;
  /** Tally of the selected penguin's drops (resets via clear). */
  simCounts: number[];
  resHitTotal: number;
  resHitBalls: number;
  /** Per-penguin comparison (length 3) or null before the first compare. */
  compare: BatchStat[] | null;
  /** Manually-logged real outcomes (length 7). */
  realCounts: number[];
  /** A long batch run is in flight. */
  busy: boolean;
  /** 0..1 progress of the current batch. */
  progress: number;
}

function zeros(): number[] {
  return new Array(BINS).fill(0);
}

function loadStoredLayout(): StoredLayout {
  const stored = readJson<StoredLayout>(LAYOUT_KEY);
  if (stored && stored.layout && stored.physics && stored.launch && validLayout(stored.layout)) {
    return {
      layout: stored.layout,
      physics: { ...DEFAULT_PHYSICS, ...stored.physics },
      launch: { ...DEFAULT_LAUNCH, ...stored.launch }
    };
  }
  return {
    layout: defaultLayout(),
    physics: { ...DEFAULT_PHYSICS },
    launch: { ...DEFAULT_LAUNCH }
  };
}

function validLayout(l: unknown): l is Layout {
  if (!l || typeof l !== 'object') return false;
  const o = l as Partial<Layout>;
  return (
    Array.isArray(o.penguins) &&
    Array.isArray(o.pins) &&
    Array.isArray(o.bumpers) &&
    Array.isArray(o.bars)
  );
}

function loadReal(): number[] {
  const stored = readJson<number[]>(REAL_KEY);
  if (Array.isArray(stored) && stored.length === BINS) return stored.map((n) => Number(n) || 0);
  return zeros();
}

const init = loadStoredLayout();

const state = $state<GingadoState>({
  layout: init.layout,
  physics: init.physics,
  launch: init.launch,
  selPen: 1,
  mode: 'drag',
  simCounts: zeros(),
  resHitTotal: 0,
  resHitBalls: 0,
  compare: null,
  realCounts: loadReal(),
  busy: false,
  progress: 0
});

function persistLayout(): boolean {
  return writeJson<StoredLayout>(LAYOUT_KEY, {
    layout: state.layout,
    physics: state.physics,
    launch: state.launch
  });
}

function persistReal(): void {
  writeJson<number[]>(REAL_KEY, state.realCounts);
}

// ---- mass simulation runs in a Web Worker (off the main thread) ----
let worker: Worker | null = null;
/** Resolves the in-flight batch promise early when a run is cancelled. */
let activeDone: (() => void) | null = null;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null; // SSR / prerender
  if (!worker) {
    worker = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

/** Stop any in-flight batch: kill the worker's computation and release the
 * pending promise. A fresh worker is spun up on the next run. */
function stopBatch(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (activeDone) {
    const done = activeDone;
    activeDone = null;
    done();
  }
  state.busy = false;
  state.progress = 0;
}

/** Shared params snapshot for a worker request — plain (un-proxied) data so it
 * survives structured clone across the worker boundary. */
function simParams(): SimParams {
  return {
    layout: $state.snapshot(state.layout),
    rest: state.physics.rest,
    kick: state.physics.kick,
    grav: state.physics.grav,
    pow: state.launch.pow,
    aimDeg: state.launch.aimDeg,
    swDeg: state.launch.swDeg,
    angleMode: state.launch.angleMode
  };
}

export const gingado = {
  get layout(): Layout {
    return state.layout;
  },
  get physics(): PhysicsParams {
    return state.physics;
  },
  get launch(): LaunchParams {
    return state.launch;
  },
  get selPen(): PenIndex {
    return state.selPen;
  },
  get mode(): EditMode {
    return state.mode;
  },
  get simCounts(): number[] {
    return state.simCounts;
  },
  get simN(): number {
    return state.simCounts.reduce((a, b) => a + b, 0);
  },
  get simStat(): BatchStat {
    return summarize(state.simCounts, state.resHitTotal, state.resHitBalls);
  },
  get compare(): BatchStat[] | null {
    return state.compare;
  },
  get realCounts(): number[] {
    return state.realCounts;
  },
  get realN(): number {
    return state.realCounts.reduce((a, b) => a + b, 0);
  },
  get realStat(): BatchStat {
    return summarize(state.realCounts, 0, 0);
  },
  get busy(): boolean {
    return state.busy;
  },
  get progress(): number {
    return state.progress;
  },

  /** The hot-loop world for the current params. */
  get world(): SimWorld {
    return makeWorld(state.layout, state.physics, state.launch);
  },
  penX(i: number): number {
    return state.layout.penguins[i]?.x ?? state.layout.penguins[0].x;
  },

  // --- selection / mode ---
  setSelPen(i: PenIndex): void {
    state.selPen = i;
  },
  setMode(m: EditMode): void {
    state.mode = m;
  },

  // --- param setters (bound to sliders) ---
  setPow(v: number): void {
    state.launch.pow = v;
  },
  setAimDeg(v: number): void {
    state.launch.aimDeg = v;
  },
  setSwDeg(v: number): void {
    state.launch.swDeg = v;
  },
  setAngleMode(m: AngleMode): void {
    state.launch.angleMode = m;
  },
  setRest(v: number): void {
    state.physics.rest = v;
  },
  setKick(v: number): void {
    state.physics.kick = v;
  },
  setGrav(v: number): void {
    state.physics.grav = v;
  },

  // --- editor mutations (positions are mutated in place during drag) ---
  addPin(x: number, y: number): void {
    state.layout.pins.push({ x, y, r: 6 });
  },
  addBumper(x: number, y: number): void {
    state.layout.bumpers.push({ x, y, r: 19 });
  },
  addBar(x: number, y: number): void {
    state.layout.bars.push({ x1: x - 22, y1: y, x2: x + 22, y2: y, r: 6 });
  },
  removePin(i: number): void {
    state.layout.pins.splice(i, 1);
  },
  removeBumper(i: number): void {
    state.layout.bumpers.splice(i, 1);
  },
  removeBar(i: number): void {
    state.layout.bars.splice(i, 1);
  },

  // --- simulation tallies ---
  /** Record one finalized drop (used by the animated single drop). */
  recordDrop(bin: number, hits: number): void {
    const next = state.simCounts.slice();
    next[bin]++;
    state.simCounts = next;
    state.resHitTotal += hits;
    state.resHitBalls++;
    // A fresh manual drop invalidates nothing, but the comparison is stale.
  },
  clearSim(): void {
    stopBatch();
    state.simCounts = zeros();
    state.resHitTotal = 0;
    state.resHitBalls = 0;
  },
  /** Cancel an in-flight batch without clearing the tally. */
  cancelBatch(): void {
    stopBatch();
  },

  /** Simulate `n` drops from the selected penguin (off the main thread),
   * accumulating onto the current tally. Resolves when the worker is done. */
  async simulateMany(n: number): Promise<void> {
    if (state.busy) return;
    const w = getWorker();
    if (!w) return; // no worker (SSR) — nothing to do
    state.busy = true;
    state.progress = 0;
    await new Promise<void>((resolve) => {
      activeDone = resolve;
      const onMsg = (e: MessageEvent<WorkerResponse>) => {
        const d = e.data;
        if (d.type === 'progress') {
          state.progress = d.value;
        } else if (d.type === 'simResult') {
          state.simCounts = d.counts;
          state.resHitTotal = d.hitTotal;
          state.resHitBalls = d.balls;
          state.busy = false;
          state.progress = 1;
          activeDone = null;
          w.removeEventListener('message', onMsg);
          resolve();
        }
      };
      w.addEventListener('message', onMsg);
      w.postMessage({
        kind: 'sim',
        ...simParams(),
        startX: this.penX(state.selPen),
        n,
        baseCounts: state.simCounts.slice(),
        baseHitTotal: state.resHitTotal,
        baseBalls: state.resHitBalls
      });
    });
  },

  /** Run an isolated batch from each penguin (off the main thread) and rank
   * them by EV. Does not touch the main tally. */
  async compareAll(n: number): Promise<void> {
    if (state.busy) return;
    const w = getWorker();
    if (!w) return;
    state.busy = true;
    state.progress = 0;
    await new Promise<void>((resolve) => {
      activeDone = resolve;
      const onMsg = (e: MessageEvent<WorkerResponse>) => {
        const d = e.data;
        if (d.type === 'progress') {
          state.progress = d.value;
        } else if (d.type === 'compareResult') {
          state.compare = d.results.map((r) => summarize(r.counts, r.hitTotal, r.n));
          state.busy = false;
          state.progress = 1;
          activeDone = null;
          w.removeEventListener('message', onMsg);
          resolve();
        }
      };
      w.addEventListener('message', onMsg);
      w.postMessage({
        kind: 'compare',
        ...simParams(),
        startXs: Array.from({ length: PEN_COUNT }, (_, p) => this.penX(p)),
        n
      });
    });
  },

  /** Index of the best-EV penguin in the last comparison, or -1. */
  get bestPen(): number {
    const c = state.compare;
    if (!c) return -1;
    let best = 0;
    for (let i = 1; i < c.length; i++) if (c[i].ev > c[best].ev) best = i;
    return best;
  },

  // --- real log (manual calibration) ---
  addReal(bin: number): void {
    if (bin < 0 || bin >= BINS) return;
    const next = state.realCounts.slice();
    next[bin]++;
    state.realCounts = next;
    persistReal();
  },
  undoReal(bin: number): void {
    if (bin < 0 || bin >= BINS || state.realCounts[bin] <= 0) return;
    const next = state.realCounts.slice();
    next[bin]--;
    state.realCounts = next;
    persistReal();
  },
  clearReal(): void {
    state.realCounts = zeros();
    persistReal();
  },

  // --- persistence: layout + params ---
  saveLayout(): boolean {
    return persistLayout();
  },
  loadLayout(): 'ok' | 'none' | 'fail' {
    const stored = readJson<StoredLayout>(LAYOUT_KEY);
    if (!stored) return 'none';
    if (!validLayout(stored.layout)) return 'fail';
    state.layout = stored.layout;
    state.physics = { ...DEFAULT_PHYSICS, ...stored.physics };
    state.launch = { ...DEFAULT_LAUNCH, ...stored.launch };
    this.clearSim();
    state.compare = null;
    return 'ok';
  },
  resetToDefault(): void {
    state.layout = defaultLayout();
    state.physics = { ...DEFAULT_PHYSICS };
    state.launch = { ...DEFAULT_LAUNCH };
    this.clearSim();
    state.compare = null;
  },

  // --- export / import as JSON text ---
  exportJson(): string {
    const snap: StoredLayout = {
      layout: state.layout,
      physics: state.physics,
      launch: state.launch
    };
    return JSON.stringify(snap, null, 2);
  },
  importJson(text: string): boolean {
    try {
      const o = JSON.parse(text) as StoredLayout;
      if (!validLayout(o.layout)) return false;
      state.layout = o.layout;
      state.physics = { ...DEFAULT_PHYSICS, ...(o.physics ?? {}) };
      state.launch = { ...DEFAULT_LAUNCH, ...(o.launch ?? {}) };
      this.clearSim();
      state.compare = null;
      return true;
    } catch {
      return false;
    }
  },

  // --- tour ---
  hasSeenTour(): boolean {
    return readString(TOUR_KEY) === '1';
  },
  markTourSeen(): void {
    writeString(TOUR_KEY, '1');
  }
};
