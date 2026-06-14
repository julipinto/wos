<script lang="ts">
  /**
   * Numeric input for game-scale amounts (millions, billions). Idle it shows a
   * compact value (1.2B, 550M, 1.46K) so big numbers always fit the field;
   * focused it shows the exact integer for precise editing. Also accepts
   * shorthand — "2b", "550m", "1.46k" — so you don't type nine zeros. Reports a
   * plain number via onChange.
   */
  import { groupNumber } from '$lib/i18n/index.svelte';

  interface Props {
    value: number;
    onChange: (n: number) => void;
    ariaLabel?: string;
    min?: number;
    placeholder?: string;
  }
  let { value, onChange, ariaLabel, min = 0, placeholder = '0' }: Props = $props();

  let focused = $state(false);
  let text = $state('');

  const UNITS: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K']
  ];
  const trimZeros = (s: string) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);
  function compact(n: number): string {
    if (n < 1000) return groupNumber(n);
    for (const [v, s] of UNITS) {
      if (n >= v) {
        const x = n / v;
        const d = x >= 100 ? 0 : x >= 10 ? 1 : 2;
        return trimZeros(x.toFixed(d)) + s;
      }
    }
    return groupNumber(n);
  }

  const MULT: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
  function parse(raw: string): number {
    const s = raw.trim().toLowerCase().replace(/\s/g, '');
    // Shorthand like "2b", "1.5m", "550m" — numeric part × unit.
    const m = s.match(/^([\d.,]+)([kmbt])$/);
    if (m) {
      const num = parseFloat(m[1].replace(',', '.'));
      return Number.isFinite(num) ? Math.round(num * MULT[m[2]]) : 0;
    }
    // Otherwise a plain integer, ignoring any grouping separators.
    const digits = s.replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  }

  const display = $derived(focused ? text : value > 0 ? compact(value) : '');

  function onInput(e: Event & { currentTarget: HTMLInputElement }) {
    text = e.currentTarget.value;
    onChange(Math.max(min, parse(text)));
  }
  function onFocus() {
    focused = true;
    text = value > 0 ? String(value) : '';
  }
</script>

<input
  type="text"
  inputmode="text"
  value={display}
  oninput={onInput}
  onfocus={onFocus}
  onblur={() => (focused = false)}
  aria-label={ariaLabel}
  title="2b · 550m · 1.46k"
  {placeholder}
/>

<style>
  input {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 14px;
    padding: 10px 12px;
    text-align: end;
  }
  input:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
</style>
