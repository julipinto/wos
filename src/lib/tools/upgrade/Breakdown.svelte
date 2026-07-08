<script lang="ts">
  /**
   * A small ledger under a resource row: label → amount lines, with an optional
   * emphasized `total` line. Reusable for any resource that decomposes into parts
   * (e.g. Fire Crystal = construction + refining). Amounts flagged `estimate` get
   * a ~ prefix. Design-system only — no bespoke colours.
   */
  import { formatQty } from './engine';

  export interface BreakdownLine {
    label: string;
    value: number;
    /** Prefix the amount with ~ (it's an estimate, not an exact figure). */
    estimate?: boolean;
    /** Render as the emphasized summary line (bold, display font, top rule). */
    total?: boolean;
  }
  let { lines }: { lines: BreakdownLine[] } = $props();
</script>

<div class="breakdown">
  {#each lines as l (l.label)}
    <div class="bd" class:total={l.total}>
      <span class="bd-lbl">{l.label}</span>
      <span class="bd-n">{l.estimate ? '~' : ''}{formatQty(l.value)}</span>
    </div>
  {/each}
</div>

<style>
  .breakdown {
    display: grid;
    gap: 7px;
    padding: 11px 18px 14px 46px;
    border-top: 1px dashed var(--border);
  }
  .bd {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .bd-lbl {
    flex: 1;
  }
  .bd-n {
    font-variant-numeric: tabular-nums;
  }
  .bd.total {
    margin-top: 1px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
    color: var(--text);
    font-weight: 700;
  }
  .bd.total .bd-lbl {
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10.5px;
  }
  .bd.total .bd-n {
    font-family: var(--font-display);
    font-size: 17px;
  }
</style>
