/**
 * Shared "summed vs individual" toggle for the totals views. One global choice
 * (persisted) so every additive calculator shows totals the same way.
 */
import { readJson, writeJson } from '$lib/utils/storage';

export type TotalsMode = 'sum' | 'individual';
const KEY = 'upgrade-totals-mode';

let mode = $state<TotalsMode>(readJson<TotalsMode>(KEY) === 'individual' ? 'individual' : 'sum');

export const totalsMode = {
  get value(): TotalsMode {
    return mode;
  },
  set(m: TotalsMode): void {
    mode = m;
    writeJson(KEY, m);
  }
};
