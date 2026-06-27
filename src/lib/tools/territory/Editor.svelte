<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Button from '$lib/components/Button.svelte';
  import Select from '$lib/components/Select.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import type { PlacedObject } from './territory';

  // Tag editor for a single selected object (name always; furnace/power/bear for cities).
  interface Props {
    selected: PlacedObject;
    typeLabel: string;
    isCity: boolean;
    hasBears: boolean;
    bearCount: number;
    furnaceOptions: { value: string; label: string }[];
    convertOptions: { value: string; label: string }[];
    setTag: (key: 'name' | 'label' | 'furnace' | 'power' | 'uid', value: string | number) => void;
    toggleBear: (n: number) => void;
    toggleBearMain: (n: number) => void;
    onConvert: (type: string) => void;
    onDuplicate: () => void;
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
    convertOptions,
    setTag,
    toggleBear,
    toggleBearMain,
    onConvert,
    onDuplicate,
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
      <TextInput
        value={selected.name ?? ''}
        oninput={(e) => setTag('name', e.currentTarget.value)}
      />
    </label>
    <label class="ed-field">
      <span class="field-label">{i18n.m.territory.tag.label}</span>
      <TextInput
        value={selected.label ?? ''}
        oninput={(e) => setTag('label', e.currentTarget.value)}
      />
    </label>
    {#if convertOptions.length > 0}
      <label class="ed-field">
        <span class="field-label">{i18n.m.territory.convert}</span>
        <Select
          value=""
          options={[{ value: '', label: '—' }, ...convertOptions]}
          onChange={(v) => v && onConvert(v)}
          ariaLabel={i18n.m.territory.convert}
        />
      </label>
    {/if}
    {#if isCity}
      <label class="ed-field">
        <span class="field-label">{i18n.m.territory.tag.id}</span>
        <TextInput
          value={selected.uid ?? ''}
          oninput={(e) => setTag('uid', e.currentTarget.value)}
        />
      </label>
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
              {@const n = i + 1}
              {@const joined = selected.bear?.includes(n)}
              {@const primary = selected.bearMain?.includes(n)}
              <div class="bear-chip-wrap" class:on={joined}>
                <button type="button" class="bear-chip" onclick={() => toggleBear(n)}>🐻 {n}</button
                >
                <button
                  type="button"
                  class="bear-star"
                  class:primary
                  title={i18n.m.territory.bearPrimary}
                  aria-label={i18n.m.territory.bearPrimary}
                  aria-pressed={primary}
                  onclick={() => toggleBearMain(n)}>{primary ? '★' : '☆'}</button
                >
              </div>
            {/each}
          </div>
          <span class="bear-hint">{i18n.m.territory.bearPrimaryHint}</span>
        </div>
      {/if}
    {/if}
  </div>
  <div class="ed-actions">
    <Button variant="secondary" size="sm" onclick={onDuplicate}
      >⧉ {i18n.m.territory.duplicate}</Button
    >
    <Button variant="danger" size="sm" onclick={onRemove}>{i18n.m.territory.remove}</Button>
  </div>
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
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .ed-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }
  .bear-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  /* A chip = membership button (🐻 N) + a ★ that marks it a PRIMARY trap. */
  .bear-chip-wrap {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    overflow: hidden;
    background: var(--bg-soft);
  }
  .bear-chip-wrap.on {
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  .bear-chip {
    background: transparent;
    border: 0;
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 7px 10px;
    cursor: pointer;
  }
  .bear-chip-wrap.on .bear-chip {
    color: var(--text);
  }
  .bear-star {
    background: transparent;
    border: 0;
    border-inline-start: 1px solid var(--border);
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1;
    padding: 0 9px;
    cursor: pointer;
  }
  .bear-star.primary {
    color: #fbbf24;
  }
  .bear-star:hover {
    color: #fbbf24;
  }
  .bear-hint {
    display: block;
    margin-top: 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
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
