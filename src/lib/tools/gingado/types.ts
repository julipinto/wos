/** Gingado do Pinguim — pachinko simulator types.
 *
 * The board is a fixed logical space (LW × LH); everything is stored in those
 * coordinates and scaled to the canvas at draw time. Obstacles are plain data
 * so the physics engine stays pure (no DOM, easy to run in tight loops). */

/** A launch penguin. Only its x matters — it sets the drop column, not the
 * direction (the angle is sampled per throw). */
export interface Penguin {
  x: number;
}

/** A round peg (small obstacle). Circular collider. */
export interface Pin {
  x: number;
  y: number;
  r: number;
}

/** A resource bubble — a bumper. Reflects like a pin and adds an extra KICK
 * impulse along the normal, counting a "resource touch". Circular collider. */
export interface Bumper {
  x: number;
  y: number;
  r: number;
}

/** A tilted ice shard — a capsule (segment + radius) with two draggable ends. */
export interface Bar {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  r: number;
}

/** Everything draggable on the board. */
export interface Layout {
  penguins: Penguin[];
  pins: Pin[];
  bumpers: Bumper[];
  bars: Bar[];
}

/** Bounce + bumper + gravity knobs. */
export interface PhysicsParams {
  /** Restitution / bounciness, 0..1. */
  rest: number;
  /** Extra impulse a resource bubble adds along the normal. */
  kick: number;
  /** Gravity multiplier. */
  grav: number;
}

/** How the per-throw exit angle is sampled around the vertical. */
export type AngleMode = 'uniform' | 'edges';

/** The launch ("a sacola balançando"). The player never aims — the angle is
 * sampled each throw around the base tilt. */
export interface LaunchParams {
  /** Initial speed / throw power. */
  pow: number;
  /** Base tilt in degrees (0 = straight down). Usually ~0. */
  aimDeg: number;
  /** Angle randomness in degrees (±). The "wobble" of the bag. */
  swDeg: number;
  /** uniform = flat ±sw; edges = magnitude biased away from 0 (rarely straight). */
  angleMode: AngleMode;
}

/** Which penguin is the active drop column. */
export type PenIndex = 0 | 1 | 2;

/** Editor interaction mode. */
export type EditMode = 'drag' | 'addPin' | 'addBar' | 'addBump' | 'del';

/** A simulated ball's transient physics state. */
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Resource-bubble touches accumulated this drop. */
  hits: number;
  steps: number;
  done: boolean;
  /** Bin index captured on entry (-1 until it crosses into the slots). */
  entered: number;
  /** Final resting bin (-1 until finalized). */
  bin: number;
}

/** Aggregate stats for a batch of drops from one column. */
export interface BatchStat {
  /** Expected value — average points per ball. */
  ev: number;
  /** Percentage that landed in the 500 (jackpot) pot. */
  jp: number;
  /** Average resource touches per ball. */
  hits: number;
  /** Count per pot (length 7). */
  counts: number[];
  /** Number of balls in the batch. */
  n: number;
}
