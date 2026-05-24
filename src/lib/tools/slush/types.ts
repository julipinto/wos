/** Slush types. Inventory is an array of hex strings; duplicates are allowed
 * (multiset). `['#ef4444','#ef4444','#60a5fa']` means 2 red + 1 blue. */

export type Hex = string;

/** true = ✓ (correct at this slot), false = ✕ (wrong here), null = unset. */
export type Feedback = boolean | null;

export interface Round {
  guess: Hex[];
  feedback: Feedback[];
}

export interface SolverInput {
  inventory: Hex[];
  rounds: Round[];
}

export interface SolverResult {
  /** Permutations of `inventory` that satisfy all per-slot constraints. */
  valid: Hex[][];
  /** For each slot, the set of colors that could occupy it across all valid solutions. */
  perPosition: Hex[][];
  total: number;
  /** True if we hit LIMIT and stopped enumerating. */
  truncated: boolean;
  /** True if constraints conflict (e.g. two rounds confirm different colors at the same slot). */
  contradiction: boolean;
}
