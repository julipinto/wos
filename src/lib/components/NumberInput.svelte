<script lang="ts">
  /**
   * Text input that shows an integer grouped by the current locale (100000 →
   * "100,000") so large amounts are readable, while reporting a plain number.
   * Parses digits on input; non-digits are ignored.
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

  const display = $derived(groupNumber(value));

  function onInput(e: Event & { currentTarget: HTMLInputElement }) {
    const digits = e.currentTarget.value.replace(/\D/g, '');
    const n = digits ? Number(digits) : 0;
    onChange(Math.max(min, n));
  }
</script>

<input
  type="text"
  inputmode="numeric"
  value={display}
  oninput={onInput}
  aria-label={ariaLabel}
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
