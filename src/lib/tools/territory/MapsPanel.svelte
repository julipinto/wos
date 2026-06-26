<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import { savedMaps } from './maps.svelte';

  // Collapsible panel of named, per-mode saved layouts.
  interface Props {
    mode: string;
    hasObjects: boolean;
    mapName: string;
    onSave: () => void;
    onUpdate: (id: string, name: string) => void;
    onLoad: (id: string) => void;
  }
  let { mode, hasObjects, mapName = $bindable(), onSave, onUpdate, onLoad }: Props = $props();

  let open = $state(false);
  const list = $derived(savedMaps.all(mode));
</script>

<div class="maps" class:open>
  <button class="maps-head" type="button" aria-expanded={open} onclick={() => (open = !open)}>
    <span class="maps-icon" aria-hidden="true">🗺️</span>
    <span class="maps-title">{i18n.m.territory.maps.title}</span>
    {#if list.length > 0}<span class="maps-count">{list.length}</span>{/if}
    <Icon name="chevron-down" size={14} class="caret {open ? 'up' : ''}" />
  </button>
  {#if open}
    <div class="maps-body">
      <div class="maps-save">
        <TextInput
          style="flex:1"
          bind:value={mapName}
          placeholder={i18n.m.territory.maps.name}
          aria-label={i18n.m.territory.maps.name}
        />
        <Button
          variant="secondary"
          size="sm"
          onclick={onSave}
          disabled={!mapName.trim() || !hasObjects}
        >
          {i18n.m.territory.maps.save}
        </Button>
      </div>
      {#if list.length === 0}
        <p class="maps-empty">{i18n.m.territory.maps.empty}</p>
      {:else}
        <ul class="maps-list">
          {#each list as m (m.id)}
            <li class="map-row">
              <button class="map-load" type="button" onclick={() => onLoad(m.id)}>
                <span class="map-name">{m.name}</span>
                <span class="map-meta">{m.objects.length} · {i18n.m.territory.maps.load}</span>
              </button>
              <button
                class="map-upd"
                type="button"
                onclick={() => onUpdate(m.id, m.name)}
                disabled={!hasObjects}
                title={i18n.m.territory.maps.updateHint}
              >
                {i18n.m.territory.maps.update}
              </button>
              <button
                class="map-del"
                type="button"
                onclick={() => savedMaps.remove(mode, m.id)}
                aria-label={i18n.m.territory.remove}>×</button
              >
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  .maps {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    margin-top: 14px;
  }
  .maps.open {
    border-color: var(--border-accent);
  }
  .maps-head {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: transparent;
    border: 0;
    color: var(--text);
    padding: 14px 16px;
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .maps-icon {
    font-size: 14px;
  }
  .maps-title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .maps-count {
    font-size: 11px;
    color: var(--text-dim);
  }
  .maps-head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
    margin-inline-start: auto;
  }
  .maps-head :global(.caret.up) {
    transform: rotate(180deg);
  }
  .maps-body {
    padding: 0 16px 14px;
    display: grid;
    gap: 12px;
  }
  .maps-save {
    display: flex;
    gap: 8px;
  }
  .maps-empty {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    margin: 0;
  }
  .maps-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .map-row {
    display: flex;
    gap: 8px;
  }
  .map-load {
    flex: 1;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    padding: 9px 14px;
    cursor: pointer;
    text-align: start;
    transition: border-color 0.2s ease;
  }
  .map-load:hover {
    border-color: var(--border-accent);
  }
  .map-name {
    font-size: 13px;
  }
  .map-meta {
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .map-upd {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    height: 36px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .map-upd:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .map-upd:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .map-del {
    flex-shrink: 0;
    width: 36px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-dim);
    font-size: 18px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .map-del:hover {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
  }
</style>
