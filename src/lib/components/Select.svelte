<script lang="ts">
  /**
   * Design-system dropdown. A fully custom listbox (not a native <select>) so
   * the popup is themed consistently across browsers/OSes — native <option>
   * popups render in the OS colour scheme and can't be fully styled. Mirrors
   * the accessible pattern in LocaleSwitcher: button trigger + listbox popup,
   * click-outside + Escape to close, arrow-key navigation.
   *
   * Long lists (e.g. the 41-step level ladder, 1–30 + FC1–FC10) get a type-to-
   * filter box so you can jump straight to "FC5" instead of scrolling. It only
   * appears past a threshold, so short dropdowns stay plain.
   */
  import Icon from './Icon.svelte';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    /** Accessible name for the control (e.g. the field label text). */
    ariaLabel?: string;
    /** Placeholder for the filter box on long lists (already localised). */
    searchPlaceholder?: string;
  }

  let { value, options, onChange, ariaLabel, searchPlaceholder = '' }: Props = $props();

  let open = $state(false);
  let activeIndex = $state(-1);
  let query = $state('');
  let menuEl = $state<HTMLDivElement | null>(null);
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let searchEl = $state<HTMLInputElement | null>(null);
  const itemEls: HTMLButtonElement[] = [];

  const SEARCH_THRESHOLD = 10; // show the filter box only on long lists
  const searchable = $derived(options.length > SEARCH_THRESHOLD);
  const selected = $derived(options.find((o) => o.value === value));
  // The rows currently rendered (filtered while typing); activeIndex/itemEls track these.
  const shown = $derived(
    searchable && query.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options
  );

  function openMenu() {
    open = true;
    query = '';
    const si = options.findIndex((o) => o.value === value);
    activeIndex = si >= 0 ? si : 0;
    // Focus the filter (if any) and scroll the active row into view once rendered.
    queueMicrotask(() => {
      if (searchable) searchEl?.focus();
      itemEls[activeIndex]?.scrollIntoView({ block: 'nearest' });
    });
  }
  function closeMenu(refocus = true) {
    open = false;
    if (refocus) queueMicrotask(() => triggerEl?.focus());
  }
  function pick(opt: Option) {
    onChange(opt.value);
    closeMenu();
  }
  function moveActive(delta: number) {
    if (shown.length === 0) return;
    const next = (activeIndex + delta + shown.length) % shown.length;
    activeIndex = next;
    itemEls[next]?.scrollIntoView({ block: 'nearest' });
  }

  function onTriggerKey(e: KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openMenu();
    }
  }
  function onMenuKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = shown[activeIndex];
      if (opt) pick(opt);
    } else if (!searchable && e.key === 'Home') {
      e.preventDefault();
      activeIndex = 0;
      itemEls[0]?.scrollIntoView({ block: 'nearest' });
    } else if (!searchable && e.key === 'End') {
      e.preventDefault();
      activeIndex = shown.length - 1;
      itemEls[activeIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (!searchable && e.key === ' ') {
      // On searchable lists the space bar belongs to the filter input.
      e.preventDefault();
      const opt = shown[activeIndex];
      if (opt) pick(opt);
    }
  }

  function onWindowDown(e: PointerEvent) {
    if (!open) return;
    const t = e.target as Node | null;
    if (!t) return;
    if (menuEl?.contains(t) || triggerEl?.contains(t)) return;
    closeMenu(false);
  }
  function onWindowKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      closeMenu();
    }
  }
</script>

<svelte:window onpointerdown={onWindowDown} onkeydown={onWindowKey} />

<div class="select">
  <button
    bind:this={triggerEl}
    class="trigger"
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={ariaLabel}
    onclick={() => (open ? closeMenu(false) : openMenu())}
    onkeydown={onTriggerKey}
  >
    <span class="value">{selected?.label ?? ''}</span>
    <Icon name="chevron-down" size={14} class="caret {open ? 'up' : ''}" />
  </button>

  {#if open}
    <div
      bind:this={menuEl}
      class="menu"
      role="listbox"
      tabindex="-1"
      aria-label={ariaLabel}
      onkeydown={onMenuKey}
    >
      {#if searchable}
        <div class="search">
          <span class="mag" aria-hidden="true">🔍</span>
          <input
            bind:this={searchEl}
            bind:value={query}
            placeholder={searchPlaceholder}
            aria-label={ariaLabel}
            oninput={() => (activeIndex = 0)}
          />
        </div>
      {/if}

      {#each shown as opt, i (opt.value)}
        <button
          bind:this={itemEls[i]}
          class="item"
          class:active={i === activeIndex}
          class:selected={opt.value === value}
          role="option"
          aria-selected={opt.value === value}
          type="button"
          onclick={() => pick(opt)}
          onpointermove={() => (activeIndex = i)}
        >
          <span class="item-label">{opt.label}</span>
          {#if opt.value === value}
            <Icon name="check" size={14} />
          {/if}
        </button>
      {:else}
        <div class="empty">—</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .select {
    position: relative;
    width: 100%;
  }
  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 15px;
    padding: 12px 16px;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .trigger:hover,
  .trigger[aria-expanded='true'] {
    border-color: var(--border-accent);
    background: var(--surface-strong);
  }
  .trigger:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .trigger :global(.caret) {
    flex-shrink: 0;
    color: var(--accent);
    opacity: 0.8;
    transition: transform 0.2s ease;
  }
  .trigger :global(.caret.up) {
    transform: rotate(180deg);
  }

  .menu {
    position: absolute;
    top: calc(100% + 6px);
    inset-inline: 0;
    max-height: 280px;
    overflow-y: auto;
    background: var(--bg-soft);
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    padding: 6px;
    z-index: 200;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
    display: grid;
    gap: 2px;
  }
  .search {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px 8px;
    margin-bottom: 4px;
    background: var(--bg-soft);
    border-bottom: 1px solid var(--border);
  }
  .search input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: 0;
    outline: none;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 14px;
  }
  .mag {
    font-size: 12px;
    opacity: 0.7;
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    background: transparent;
    border: 0;
    border-radius: 10px;
    color: var(--text-mid);
    cursor: pointer;
    text-align: start;
    font-family: var(--font-mono);
    font-size: 14px;
    transition: color 0.12s ease;
  }
  /* Highlight follows keyboard/pointer (activeIndex); selected gets the accent. */
  .item.active {
    background: var(--surface);
    color: var(--text);
  }
  .item.selected {
    color: var(--accent);
  }
  .item.selected.active {
    background: var(--accent-glow);
  }
  .empty {
    padding: 12px;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-dim);
  }
</style>
