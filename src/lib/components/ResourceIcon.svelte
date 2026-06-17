<script lang="ts">
  /**
   * One icon for a resource key. Prefers the real bundled game PNG, falls back
   * to the Noto colour-emoji SVG, then the raw emoji — all with the resource's
   * coloured glow. Render sites just pass the key; the source is data-driven
   * (RESOURCE_PNG / RESOURCES.noto), so swapping an icon never touches callers.
   */
  import { base } from '$app/paths';
  import EmojiIcon, { hasEmoji } from './EmojiIcon.svelte';
  import { RESOURCES } from '$lib/tools/upgrade/types';
  import { RESOURCE_PNG } from '$lib/tools/upgrade/resource-png';

  interface Props {
    resource: string;
    /** Pixel size — width and height equal. Default 20. */
    size?: number;
  }
  let { resource, size = 20 }: Props = $props();

  const def = $derived(RESOURCES.find((r) => r.key === resource));
  const png = $derived(RESOURCE_PNG[resource]);
</script>

{#if def}
  {#if png}
    <span class="ri" style="--c: {def.color}">
      <img src="{base}{png}" alt="" width={size} height={size} loading="lazy" />
    </span>
  {:else if hasEmoji(def.noto)}
    <EmojiIcon name={def.noto} {size} color={def.color} />
  {:else}
    <span class="ri raw" style="--c: {def.color}; font-size: {size}px" aria-hidden="true"
      >{def.icon}</span
    >
  {/if}
{/if}

<style>
  .ri {
    display: inline-flex;
    line-height: 1;
    filter: drop-shadow(0 0 3px color-mix(in srgb, var(--c) 65%, transparent))
      drop-shadow(0 0 9px color-mix(in srgb, var(--c) 35%, transparent));
  }
  .ri img {
    display: block;
    object-fit: contain;
  }
</style>
