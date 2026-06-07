<script lang="ts">
  // Planner-mode switcher (hive / sunfire / state).
  interface Props {
    modes: { id: string; label: string }[];
    active: string;
    ariaLabel: string;
    onSelect: (id: string) => void;
  }
  let { modes, active, ariaLabel, onSelect }: Props = $props();
</script>

<div class="modebar" role="group" aria-label={ariaLabel}>
  {#each modes as m (m.id)}
    <button
      class="mode-btn"
      class:active={active === m.id}
      type="button"
      onclick={() => onSelect(m.id)}
    >
      {m.label}
    </button>
  {/each}
</div>

<style>
  .modebar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .mode-btn {
    flex: 1;
    min-width: 90px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 14px;
    padding: 10px 14px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .mode-btn.active {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
</style>
