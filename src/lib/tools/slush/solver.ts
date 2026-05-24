import type { Hex, Round, SolverInput, SolverResult } from './types';

const LIMIT = 50_000;

/**
 * Enumerate permutations of the inventory multiset that satisfy per-position
 * constraints derived from past rounds:
 *   - feedback[i] === true  → that color is locked at slot i
 *   - feedback[i] === false → that color cannot occupy slot i
 *
 * Multiset dedup: at each backtracking depth, a `seen` set ensures each
 * distinct color is tried only once even though duplicates exist in
 * `remaining`. The inventory is sorted upfront so duplicates cluster.
 */
export function solve(input: SolverInput): SolverResult {
  const { inventory, rounds } = input;
  const N = inventory.length;
  const empty: SolverResult = {
    valid: [],
    perPosition: Array.from({ length: N }, () => []),
    total: 0,
    truncated: false,
    contradiction: false
  };
  if (N === 0) return empty;

  const confirmed: (Hex | null)[] = Array(N).fill(null);
  const wrong: Set<Hex>[] = Array.from({ length: N }, () => new Set<Hex>());
  let contradiction = false;

  for (const round of rounds) {
    for (let i = 0; i < N; i++) {
      if (round.feedback[i] === true) {
        if (confirmed[i] !== null && confirmed[i] !== round.guess[i]) contradiction = true;
        confirmed[i] = round.guess[i];
      }
      if (round.feedback[i] === false) wrong[i].add(round.guess[i]);
    }
  }
  for (let i = 0; i < N; i++) {
    if (confirmed[i] !== null && wrong[i].has(confirmed[i]!)) contradiction = true;
  }
  if (contradiction) return { ...empty, contradiction: true };

  // Confirmed counts must fit inventory.
  const invCounts = countBy(inventory);
  const confCounts = new Map<Hex, number>();
  for (const c of confirmed) if (c !== null) confCounts.set(c, (confCounts.get(c) ?? 0) + 1);
  for (const [c, ct] of confCounts) {
    if ((invCounts.get(c) ?? 0) < ct) return { ...empty, contradiction: true };
  }

  const valid: Hex[][] = [];
  const perPosition: Set<Hex>[] = Array.from({ length: N }, () => new Set<Hex>());
  const sorted = [...inventory].sort();
  const cur: Hex[] = [];
  let truncated = false;

  function bt(remaining: Hex[]): void {
    if (valid.length >= LIMIT) {
      truncated = true;
      return;
    }
    const pos = cur.length;
    if (remaining.length === 0) {
      valid.push([...cur]);
      for (let i = 0; i < N; i++) perPosition[i].add(cur[i]);
      return;
    }
    const seen = new Set<Hex>();
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      if (seen.has(c)) continue;
      seen.add(c);
      if (confirmed[pos] !== null && confirmed[pos] !== c) continue;
      if (wrong[pos].has(c)) continue;
      cur.push(c);
      bt(remaining.slice(0, i).concat(remaining.slice(i + 1)));
      cur.pop();
      if (valid.length >= LIMIT) {
        truncated = true;
        return;
      }
    }
  }
  bt(sorted);

  return {
    valid,
    perPosition: perPosition.map((s) => [...s]),
    total: valid.length,
    truncated,
    contradiction: false
  };
}

/**
 * Minimax next-pick suggestion. For each candidate guess, partition the
 * possibility space by the bitmask of which slots match — pick the candidate
 * whose worst-case partition is smallest. Capped at 600 candidates × 1500
 * sample solutions for performance.
 */
export function suggestBestGuess(possibilities: Hex[][]): Hex[] | null {
  if (possibilities.length === 0) return null;
  if (possibilities.length === 1) return possibilities[0];
  const CAND_LIMIT = 600;
  const SAMPLE_LIMIT = 1500;
  const candidates =
    possibilities.length > CAND_LIMIT ? possibilities.slice(0, CAND_LIMIT) : possibilities;
  const sample =
    possibilities.length > SAMPLE_LIMIT ? possibilities.slice(0, SAMPLE_LIMIT) : possibilities;

  let best = candidates[0];
  let bestScore = Infinity;
  for (const guess of candidates) {
    const groups = new Map<number, number>();
    for (const sol of sample) {
      let sig = 0;
      for (let i = 0; i < guess.length; i++) if (sol[i] === guess[i]) sig |= 1 << i;
      groups.set(sig, (groups.get(sig) ?? 0) + 1);
    }
    let worst = 0;
    for (const v of groups.values()) if (v > worst) worst = v;
    if (worst < bestScore) {
      bestScore = worst;
      best = guess;
    }
  }
  return best;
}

/** Confirmed positions across all rounds — color or null per slot. */
export function getConfirmedPositions(rounds: Round[], slots: number): (Hex | null)[] {
  const out: (Hex | null)[] = Array(slots).fill(null);
  for (const r of rounds) {
    for (let i = 0; i < slots; i++) {
      if (r.feedback[i] === true) out[i] = r.guess[i];
    }
  }
  return out;
}

/** Colors marked wrong at slot `idx` in any past round. */
export function blockedAtSlot(rounds: Round[], idx: number): Set<Hex> {
  const s = new Set<Hex>();
  for (const r of rounds) if (r.feedback[idx] === false) s.add(r.guess[idx]);
  return s;
}

export function countBy(arr: Hex[]): Map<Hex, number> {
  const m = new Map<Hex, number>();
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

export function remainingCounts(inventory: Hex[], placed: (Hex | null)[]): Map<Hex, number> {
  const m = countBy(inventory);
  for (const c of placed) if (c !== null) m.set(c, (m.get(c) ?? 0) - 1);
  return m;
}
