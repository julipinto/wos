<script lang="ts">
  /**
   * A guarded current → target pair of dropdowns over an ordered ladder of
   * labels. The target only offers levels at or above the current, and the
   * current only offers levels at or below the target — you can't pick an
   * invalid (backwards) range. Picking a current above the target drags the
   * target up to match (and vice-versa).
   */
  import Select from '$lib/components/Select.svelte';

  interface Props {
    labels: string[];
    from: string;
    to: string;
    onChange: (from: string, to: string) => void;
    ariaFrom?: string;
    ariaTo?: string;
  }
  let { labels, from, to, onChange, ariaFrom = '', ariaTo = '' }: Props = $props();

  const idx = (l: string) => labels.indexOf(l);
  const opt = (l: string) => ({ value: l, label: l });
  const fromOptions = $derived(labels.slice(0, Math.max(0, idx(to)) + 1).map(opt));
  const toOptions = $derived(labels.slice(Math.max(0, idx(from))).map(opt));

  function setFrom(v: string) {
    onChange(v, idx(v) > idx(to) ? v : to);
  }
  function setTo(v: string) {
    onChange(idx(v) < idx(from) ? v : from, v);
  }
</script>

<div class="range">
  <Select value={from} options={fromOptions} onChange={setFrom} ariaLabel={ariaFrom} />
  <span class="arrow" aria-hidden="true">→</span>
  <Select value={to} options={toOptions} onChange={setTo} ariaLabel={ariaTo} />
</div>

<style>
  .range {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }
  .arrow {
    color: var(--text-dim);
    flex-shrink: 0;
  }
</style>
