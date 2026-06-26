<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Select from '$lib/components/Select.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import type { PlacedObject } from './territory';

  // Tag editor for a single selected object (name always; furnace/power/bear for cities).
  interface Props {
    selected: PlacedObject;
    typeLabel: string;
    isCity: boolean;
    hasBears: boolean;
    bearCount: number;
    furnaceOptions: { value: string; label: string }[];
    setTag: (key: 'name' | 'label' | 'furnace' | 'power', value: string | number) => void;
    toggleBear: (n: number) => void;
    onRemove: () => void;
    onClose: () => void;
  }
  let {
    selected,
    typeLabel,
    isCity,
    hasBears,
    bearCount,
    furnaceOptions,
    setTag,
    toggleBear,
    onRemove,
    onClose
  }: Props = $props();
</script>

<div class="editor">
  <div class="ed-head">
    <span class="ed-title">{typeLabel}</span>
    <button class="ed-close" type="button" onclick={onClose} aria-label="close">×</button>
  </div>
  <div class="ed-fields">
    <label class="ed-field">
      <span class="field-label">{i18n.m.territory.tag.name}</span>
      <input
        type="text"
        value={selected.name ?? ''}
        oninput={(e) => setTag('name', e.currentTarget.value)}
      />
    </label>
    <label class="ed-field">
      <span class="field-label">{i18n.m.territory.tag.label}</span>
      <input
        type="text"
        value={selected.label ?? ''}
        oninput={(e) => setTag('label', e.currentTarget.value)}
      />
    </label>
    {#if isCity}
      <label class="ed-field">
        <span class="field-label">{i18n.m.territory.tag.furnace}</span>
        <Select
          value={selected.furnace ?? ''}
          options={furnaceOptions}
          onChange={(v) => setTag('furnace', v)}
          ariaLabel={i18n.m.territory.tag.furnace}
        />
      </label>
      <label class="ed-field">
        <span class="field-label">{i18n.m.territory.tag.power}</span>
        <NumberInput
          value={selected.power ?? 0}
          onChange={(n) => setTag('power', n)}
          ariaLabel={i18n.m.territory.tag.power}
        />
      </label>
      {#if hasBears && bearCount > 0}
        <div class="ed-field">
          <span class="field-label">{i18n.m.territory.tag.bear}</span>
          <div class="bear-chips">
            {#each Array(bearCount) as _, i (i)}
              <button
                type="button"
                class="bear-chip"
                class:on={selected.bear?.includes(i + 1)}
                onclick={() => toggleBear(i + 1)}>🐻 {i + 1}</button
              >
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
  <button class="ed-remove" type="button" onclick={onRemove}>× {i18n.m.territory.remove}</button>
</div>

<style>
  .editor {
    margin-top: 14px;
    background: var(--surface);
    border: 1px solid var(--border-accent);
    border-radius: var(--r-card);
    padding: 14px 16px;
  }
  .ed-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .ed-title {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .ed-close {
    background: none;
    border: 0;
    color: var(--text-dim);
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
  }
  .ed-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ed-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .ed-field input {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 14px;
    padding: 10px 12px;
  }
  .ed-field input:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .ed-remove {
    margin-top: 12px;
    background: transparent;
    border: 1px solid rgba(251, 113, 133, 0.4);
    border-radius: var(--r-pill);
    color: #fb7185;
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 7px 14px;
    cursor: pointer;
  }
  .bear-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .bear-chip {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 7px 12px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .bear-chip.on {
    color: var(--text);
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  /* Phone: the editor becomes a bottom sheet floating over the canvas (Figma /
     Excalidraw style) instead of a block that pushes the board off-screen. */
  @media (max-width: 540px) {
    .editor {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      /* Opaque fill — the translucent --surface let the footer bleed through and
         became unreadable as a floating sheet. */
      background: var(--bg-soft);
      border: 1px solid var(--border-strong);
      border-top: 1px solid var(--border-accent);
      border-radius: 16px 16px 0 0;
      max-height: 72vh;
      overflow-y: auto;
      z-index: 60;
      box-shadow: 0 -14px 44px rgba(0, 0, 0, 0.6);
      padding-bottom: max(16px, env(safe-area-inset-bottom));
    }
    /* a grabber so it reads as a sheet */
    .editor::before {
      content: '';
      display: block;
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--border-strong);
      margin: -4px auto 12px;
    }
  }
</style>
