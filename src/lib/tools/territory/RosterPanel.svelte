<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { type PlacedObject } from './territory';
  import { fmtPower } from './compare';

  // Collapsible roster: every city (member) with its furnace + power, sorted by
  // power (strongest first). Clicking a row focuses that city on the board.
  interface Props {
    objects: PlacedObject[];
    onPick: (o: PlacedObject) => void;
  }
  let { objects, onPick }: Props = $props();

  let open = $state(false);
  const members = $derived(
    objects.filter((o) => o.type === 'city').sort((a, b) => (b.power ?? 0) - (a.power ?? 0))
  );
  const totalPower = $derived(members.reduce((s, o) => s + (o.power ?? 0), 0));

  // Copy the roster as tab-separated rows (paste straight into a spreadsheet).
  let copied = $state(false);
  function copyList() {
    const text = members
      .map(
        (o, i) =>
          `${i + 1}\t${o.name || '—'}\t${o.furnace || '—'}\t${o.power ? fmtPower(o.power) : '—'}`
      )
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 1800);
    });
  }
</script>

<div class="roster" class:open>
  <div class="roster-head">
    <button class="roster-toggle" type="button" aria-expanded={open} onclick={() => (open = !open)}>
      <span class="roster-icon" aria-hidden="true">👥</span>
      <span class="roster-title">{i18n.m.territory.roster.title}</span>
      {#if members.length > 0}
        <span class="roster-count">{members.length} · Σ {fmtPower(totalPower)}</span>
      {/if}
      <Icon name="chevron-down" size={14} class="caret {open ? 'up' : ''}" />
    </button>
    {#if members.length > 0}
      <button
        class="roster-copy"
        type="button"
        title={i18n.m.territory.export.copy}
        aria-label={i18n.m.territory.export.copy}
        onclick={copyList}
      >
        {copied ? '✓' : '⧉'}
      </button>
    {/if}
  </div>
  {#if open}
    <div class="roster-body">
      {#if members.length === 0}
        <p class="roster-empty">{i18n.m.territory.roster.empty}</p>
      {:else}
        <div class="roster-cols">
          <span>#</span>
          <span>{i18n.m.territory.tag.name}</span>
          <span class="r-fc">{i18n.m.territory.tag.furnace}</span>
          <span class="r-pw">{i18n.m.territory.tag.power}</span>
        </div>
        <ul class="roster-list">
          {#each members as o, i (o.id)}
            <li>
              <button class="roster-row" type="button" onclick={() => onPick(o)}>
                <span class="r-rank">{i + 1}</span>
                <span class="r-name">{o.name || '—'}</span>
                <span class="r-fc">{o.furnace || '—'}</span>
                <span class="r-pw">{o.power ? fmtPower(o.power) : '—'}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  .roster {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    margin-top: 14px;
  }
  .roster.open {
    border-color: var(--border-accent);
  }
  .roster-head {
    display: flex;
    align-items: center;
  }
  .roster-toggle {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: 0;
    color: var(--text);
    padding: 14px 16px;
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .roster-copy {
    flex: none;
    margin-inline-end: 10px;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-mid);
    font-size: 14px;
    cursor: pointer;
  }
  .roster-copy:hover {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .roster-icon {
    font-size: 14px;
  }
  .roster-title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .roster-count {
    font-size: 11px;
    color: var(--text-dim);
  }
  .roster-head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
    margin-inline-start: auto;
  }
  .roster-head :global(.caret.up) {
    transform: rotate(180deg);
  }
  .roster-body {
    padding: 0 12px 12px;
  }
  .roster-empty {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    margin: 0 4px;
  }
  .roster-cols,
  .roster-row {
    display: grid;
    grid-template-columns: 2ch 1fr 5ch 6ch;
    gap: 10px;
    align-items: center;
  }
  .roster-cols {
    padding: 4px 10px 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
    border-bottom: 1px solid var(--border);
  }
  .roster-list {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
    max-height: 300px;
    overflow-y: auto;
  }
  .roster-row {
    width: 100%;
    background: transparent;
    border: 0;
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    text-align: start;
    padding: 6px 10px;
    cursor: pointer;
  }
  .roster-row:hover {
    background: var(--bg-soft);
  }
  .r-rank {
    color: var(--text-dim);
    text-align: end;
  }
  .r-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .r-fc {
    color: var(--text-mid);
  }
  .r-pw {
    text-align: end;
    color: var(--accent);
  }
</style>
