/** Gingado do Pinguim — pure physics engine.
 *
 * A faithful port of the vanilla prototype's motor (htmls/gingado-fisica.html):
 * fixed-step integration, circular collisions (ball vs pins/bumpers),
 * circle-vs-capsule collisions (ball vs tilted shards), tall pot dividers that
 * capture the ball into the column it enters. No DOM here — the same `step()`
 * runs both the animated single drop and the mass simulation. */

import type { AngleMode, Ball, Bar, BatchStat, Bumper, Layout, Pin } from './types';

// --- Logical board space (scaled to the canvas at draw time) ---
export const LW = 360;
export const LH = 470;
export const BALL_R = 6;

// --- Pots ---
export const VALUES = [10, 70, 130, 500, 130, 70, 10] as const;
export const BINS = VALUES.length; // 7
export const JACKPOT = 3; // index of the central 500 pot

// --- Integration ---
export const DT = 1 / 240;
/** Sub-steps per animation frame (mass sim runs the same step in a tight loop). */
export const SUBS = 4;
/** Safety cap on steps per ball so a stuck ball can't loop forever. */
const MAX_STEPS = 6000;

// --- Pot geometry (derived from the fixed board, so computed once) ---
const BIN_MARGIN = 18;
export const FLOOR_Y = LH - 14; // 456
export const BIN_TOP_Y = LH - 70; // 400

/** x of each divider, length BINS+1. */
export const SEP_XS: number[] = (() => {
  const u = LW - 2 * BIN_MARGIN;
  const xs: number[] = [];
  for (let i = 0; i <= BINS; i++) xs.push(BIN_MARGIN + (i * u) / BINS);
  return xs;
})();

/** x of each pot's center, length BINS. */
export const BIN_CENTERS: number[] = (() => {
  const u = LW - 2 * BIN_MARGIN;
  const cs: number[] = [];
  for (let i = 0; i < BINS; i++) cs.push(BIN_MARGIN + ((i + 0.5) * u) / BINS);
  return cs;
})();

/** Flattened world handed to the hot loop — primitives are cheap to read. */
export interface SimWorld {
  pins: Pin[];
  bumpers: Bumper[];
  bars: Bar[];
  rest: number;
  kick: number;
  grav: number;
  pow: number;
  /** Base tilt in radians. */
  aim: number;
  /** Angle randomness in radians (±). */
  sw: number;
  angleMode: AngleMode;
}

const DEG = Math.PI / 180;

/** Build the hot-loop world from the editable layout + params. */
export function makeWorld(
  layout: Layout,
  params: { rest: number; kick: number; grav: number },
  launch: { pow: number; aimDeg: number; swDeg: number; angleMode: AngleMode }
): SimWorld {
  return {
    pins: layout.pins,
    bumpers: layout.bumpers,
    bars: layout.bars,
    rest: params.rest,
    kick: params.kick,
    grav: params.grav,
    pow: launch.pow,
    aim: launch.aimDeg * DEG,
    sw: launch.swDeg * DEG,
    angleMode: launch.angleMode
  };
}

/** Sample the exit angle for one throw (radians from vertical).
 *  - uniform: flat over [aim-sw, aim+sw]
 *  - edges:   sign random, magnitude in [0.5·sw, sw] → straight is rare */
export function sampleAngle(world: SimWorld, rng: () => number = Math.random): number {
  if (world.angleMode === 'edges') {
    const sign = rng() < 0.5 ? -1 : 1;
    const mag = world.sw * (0.5 + 0.5 * rng());
    return world.aim + sign * mag;
  }
  return world.aim + (rng() * 2 - 1) * world.sw;
}

/** Spawn a ball at column x with a freshly-sampled launch angle. */
export function createBall(world: SimWorld, startX: number, rng: () => number = Math.random): Ball {
  const ang = sampleAngle(world, rng);
  const sp = world.pow;
  return {
    x: startX,
    y: 18,
    vx: Math.sin(ang) * sp,
    vy: Math.max(0, Math.cos(ang) * sp),
    hits: 0,
    steps: 0,
    done: false,
    entered: -1,
    bin: -1
  };
}

/** Circular collision: push out of overlap, reflect velocity by the normal.
 *  When `bumper`, also add a KICK impulse along the normal and count a touch. */
function collideCircle(
  world: SimWorld,
  ball: Ball,
  cx: number,
  cy: number,
  cr: number,
  bumper: boolean
): void {
  const dx = ball.x - cx;
  const dy = ball.y - cy;
  const minD = cr + BALL_R;
  const d2 = dx * dx + dy * dy;
  if (d2 < minD * minD && d2 > 1e-4) {
    const d = Math.sqrt(d2);
    const nx = dx / d;
    const ny = dy / d;
    const ov = minD - d;
    ball.x += nx * ov;
    ball.y += ny * ov;
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      ball.vx -= (1 + world.rest) * vn * nx;
      ball.vy -= (1 + world.rest) * vn * ny;
      if (bumper) {
        ball.vx += nx * world.kick * 22;
        ball.vy += ny * world.kick * 22;
        ball.hits++;
      }
    }
  }
}

/** Circle-vs-capsule: collide against the closest point on the bar segment. */
function collideBar(world: SimWorld, ball: Ball, b: Bar): void {
  const abx = b.x2 - b.x1;
  const aby = b.y2 - b.y1;
  const L2 = abx * abx + aby * aby || 1;
  let t = ((ball.x - b.x1) * abx + (ball.y - b.y1) * aby) / L2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  collideCircle(world, ball, b.x1 + t * abx, b.y1 + t * aby, b.r, false);
}

/** Which pot does x fall into. */
export function binOf(x: number): number {
  for (let i = 0; i < BINS; i++) {
    if (x >= SEP_XS[i] && x < SEP_XS[i + 1]) return i;
  }
  return x < SEP_XS[0] ? 0 : BINS - 1;
}

/** Advance one ball by a single fixed time-step. */
export function step(world: SimWorld, ball: Ball): void {
  const dt = DT;
  ball.vy += world.grav * 220 * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Side walls.
  if (ball.x < 6 + BALL_R) {
    ball.x = 6 + BALL_R;
    ball.vx = -ball.vx * world.rest;
  }
  if (ball.x > LW - 6 - BALL_R) {
    ball.x = LW - 6 - BALL_R;
    ball.vx = -ball.vx * world.rest;
  }

  for (const b of world.bars) collideBar(world, ball, b);
  for (const p of world.pins) collideCircle(world, ball, p.x, p.y, p.r, false);
  for (const b of world.bumpers) collideCircle(world, ball, b.x, b.y, b.r, true);

  // Tall dividers: bounce off their tops while still above the slots.
  if (ball.entered < 0 && ball.y > BIN_TOP_Y - 16 && ball.y < BIN_TOP_Y + 2) {
    for (const s of SEP_XS) collideCircle(world, ball, s, BIN_TOP_Y, 3, false);
  }

  // Once it crosses into the slot row it is captured in the column it entered.
  if (ball.entered < 0 && ball.y > BIN_TOP_Y) ball.entered = binOf(ball.x);
  if (ball.entered >= 0) {
    const lo = SEP_XS[ball.entered] + BALL_R;
    const hi = SEP_XS[ball.entered + 1] - BALL_R;
    if (ball.x < lo) {
      ball.x = lo;
      ball.vx = -ball.vx * world.rest;
    }
    if (ball.x > hi) {
      ball.x = hi;
      ball.vx = -ball.vx * world.rest;
    }
  }

  // Floor.
  if (ball.y > FLOOR_Y - BALL_R) {
    ball.y = FLOOR_Y - BALL_R;
    ball.vy = -ball.vy * world.rest * 0.5;
    ball.vx *= 0.7;
  }

  ball.vx *= 0.999;
  ball.vy *= 0.9995;
  ball.steps++;

  const slow = Math.abs(ball.vx) < 3 && Math.abs(ball.vy) < 6;
  if ((ball.entered >= 0 && slow) || ball.steps > MAX_STEPS) {
    ball.bin = ball.entered >= 0 ? ball.entered : binOf(ball.x);
    ball.done = true;
  }
}

/** Run one drop to completion (no drawing). Returns the finalized ball. */
export function simulateOne(
  world: SimWorld,
  startX: number,
  rng: () => number = Math.random
): Ball {
  const b = createBall(world, startX, rng);
  while (!b.done) step(world, b);
  return b;
}

/** Aggregate `counts`/`hits` into EV, jackpot %, and average touches. */
export function summarize(counts: number[], hitTotal: number, n: number): BatchStat {
  const total = counts.reduce((a, b) => a + b, 0) || 0;
  let pts = 0;
  for (let i = 0; i < BINS; i++) pts += counts[i] * VALUES[i];
  return {
    ev: total ? pts / total : 0,
    jp: total ? (counts[JACKPOT] / total) * 100 : 0,
    hits: n ? hitTotal / n : 0,
    counts,
    n
  };
}
