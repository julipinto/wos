/// <reference lib="webworker" />
/** Gingado mass-simulation worker.
 *
 * Drops run off the main thread so a 2,000-ball batch (or the 3×N comparison)
 * never blocks the UI. The worker rebuilds the pure SimWorld from the params it
 * receives, runs the same `simulateOne` as the animated drop, and streams back
 * progress + final tallies. */

import { makeWorld, simulateOne, BINS } from './physics';
import type { AngleMode, Layout } from './types';

/** Everything needed to rebuild the hot-loop world. */
export interface SimParams {
  layout: Layout;
  rest: number;
  kick: number;
  grav: number;
  pow: number;
  aimDeg: number;
  swDeg: number;
  angleMode: AngleMode;
}

export interface SimRequest extends SimParams {
  kind: 'sim';
  /** Drop column x. */
  startX: number;
  n: number;
  /** Accumulate onto these (so a batch adds to the running tally). */
  baseCounts: number[];
  baseHitTotal: number;
  baseBalls: number;
}

export interface CompareRequest extends SimParams {
  kind: 'compare';
  /** One drop column per penguin. */
  startXs: number[];
  n: number;
}

export type WorkerRequest = SimRequest | CompareRequest;

export interface ProgressMsg {
  type: 'progress';
  value: number;
}
export interface SimResultMsg {
  type: 'simResult';
  counts: number[];
  hitTotal: number;
  balls: number;
}
export interface CompareResultMsg {
  type: 'compareResult';
  results: { counts: number[]; hitTotal: number; n: number }[];
}
export type WorkerResponse = ProgressMsg | SimResultMsg | CompareResultMsg;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

/** How often to report progress (in balls) — frequent enough for a smooth bar,
 * rare enough that postMessage overhead is negligible. */
const PROGRESS_EVERY = 200;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const m = e.data;
  const world = makeWorld(
    m.layout,
    { rest: m.rest, kick: m.kick, grav: m.grav },
    { pow: m.pow, aimDeg: m.aimDeg, swDeg: m.swDeg, angleMode: m.angleMode }
  );

  if (m.kind === 'sim') {
    const counts = m.baseCounts.slice();
    let hitTotal = m.baseHitTotal;
    let balls = m.baseBalls;
    for (let i = 0; i < m.n; i++) {
      const b = simulateOne(world, m.startX);
      counts[b.bin]++;
      hitTotal += b.hits;
      balls++;
      if (i % PROGRESS_EVERY === PROGRESS_EVERY - 1) {
        ctx.postMessage({ type: 'progress', value: (i + 1) / m.n } satisfies ProgressMsg);
      }
    }
    ctx.postMessage({ type: 'simResult', counts, hitTotal, balls } satisfies SimResultMsg);
    return;
  }

  const results: CompareResultMsg['results'] = [];
  const totalAll = m.n * m.startXs.length;
  let doneAll = 0;
  for (const startX of m.startXs) {
    const counts = new Array<number>(BINS).fill(0);
    let hitTotal = 0;
    for (let i = 0; i < m.n; i++) {
      const b = simulateOne(world, startX);
      counts[b.bin]++;
      hitTotal += b.hits;
      doneAll++;
      if (doneAll % PROGRESS_EVERY === 0) {
        ctx.postMessage({ type: 'progress', value: doneAll / totalAll } satisfies ProgressMsg);
      }
    }
    results.push({ counts, hitTotal, n: m.n });
  }
  ctx.postMessage({ type: 'compareResult', results } satisfies CompareResultMsg);
};
