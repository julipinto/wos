<script lang="ts">
  import {
    i18n,
    SUPPORTED_LOCALES,
    LOCALE_NAMES,
    numberFormat,
    NUMBER_FORMATS,
    type Locale
  } from '$lib/i18n/index.svelte';
  import Icon from './Icon.svelte';

  let open = $state(false);
  let menuEl = $state<HTMLDivElement | null>(null);
  let triggerEl = $state<HTMLButtonElement | null>(null);

  function pick(code: Locale) {
    i18n.setLocale(code);
    open = false;
    queueMicrotask(() => triggerEl?.focus());
  }

  function onWindowDown(e: PointerEvent) {
    if (!open) return;
    const t = e.target as Node | null;
    if (!t) return;
    if (menuEl?.contains(t) || triggerEl?.contains(t)) return;
    open = false;
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      open = false;
      triggerEl?.focus();
    }
  }
</script>

<svelte:window onpointerdown={onWindowDown} onkeydown={onKey} />

<div class="wrap">
  <button
    bind:this={triggerEl}
    class="trigger"
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label="Language"
    onclick={() => (open = !open)}
  >
    <Icon name="languages" size={13} class="globe" />
    <span class="label">{LOCALE_NAMES[i18n.locale]}</span>
    <Icon name="chevron-down" size={12} class="caret {open ? 'up' : ''}" />
  </button>

  {#if open}
    <div bind:this={menuEl} class="menu" role="listbox" aria-label="Language">
      {#each SUPPORTED_LOCALES as code (code)}
        <button
          class="item"
          class:active={code === i18n.locale}
          role="option"
          aria-selected={code === i18n.locale}
          type="button"
          onclick={() => pick(code)}
        >
          <span class="item-code">{code}</span>
          <span class="item-name">{LOCALE_NAMES[code]}</span>
          {#if code === i18n.locale}
            <Icon name="check" size={14} />
          {/if}
        </button>
      {/each}

      <div class="divider" role="separator"></div>
      <span class="group-label">{i18n.m.common.numbers}</span>
      {#each NUMBER_FORMATS as fmt (fmt)}
        <button
          class="item"
          class:active={fmt === numberFormat.value}
          role="option"
          aria-selected={fmt === numberFormat.value}
          type="button"
          onclick={() => numberFormat.set(fmt)}
        >
          <span class="item-code">{fmt === 'auto' ? 'A' : '#'}</span>
          <span class="item-name">{fmt === 'auto' ? 'Auto' : numberFormat.sample(fmt)}</span>
          {#if fmt === numberFormat.value}
            <Icon name="check" size={14} />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    display: inline-block;
  }
  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--surface-strong);
    border: 1px solid var(--border-strong);
    /* Main font colour with a little transparency — visible at a glance so the
       language picker isn't mistaken for an English-only page. */
    color: color-mix(in srgb, var(--text) 82%, transparent);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 7px 13px;
    border-radius: var(--r-pill);
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .trigger:hover,
  .trigger[aria-expanded='true'] {
    color: var(--text);
    border-color: var(--border-accent);
    background: var(--surface-hover);
  }
  .trigger :global(.globe) {
    opacity: 1;
    color: var(--accent);
  }
  .trigger :global(.caret) {
    opacity: 0.6;
    transition: transform 0.2s ease;
  }
  .trigger :global(.caret.up) {
    transform: rotate(180deg);
  }

  .menu {
    position: absolute;
    top: calc(100% + 6px);
    inset-inline-end: 0;
    min-width: 180px;
    background: var(--bg-soft);
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    padding: 6px;
    z-index: 200;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: grid;
    gap: 2px;
  }
  .item {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: transparent;
    border: 0;
    border-radius: 10px;
    color: var(--text-mid);
    cursor: pointer;
    text-align: start;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.5px;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }
  .item:hover {
    background: var(--surface);
    color: var(--text);
  }
  .item.active {
    color: var(--accent);
    background: var(--accent-glow);
  }
  .item-code {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .item.active .item-code {
    color: var(--accent);
    opacity: 0.7;
  }
  .item-name {
    font-size: 12px;
    letter-spacing: 0;
    text-transform: none;
  }
  .divider {
    height: 1px;
    background: var(--border);
    margin: 6px 4px;
  }
  .group-label {
    display: block;
    padding: 2px 10px 4px;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
</style>
