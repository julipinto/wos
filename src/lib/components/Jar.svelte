<script lang="ts">
  import { shade } from '$lib/utils/format';

  interface Props {
    hex: string;
    /** Render as an empty dashed slot instead of a filled jar. */
    empty?: boolean;
    /** Bob animation delay in seconds. Omit to disable. */
    bobDelay?: number | null;
    /** Scale multiplier (1 = native 40×52). */
    scale?: number;
  }

  let { hex, empty = false, bobDelay = null, scale = 1 }: Props = $props();

  let dark = $derived(shade(hex, -25));
  let width = $derived(40 * scale);
  let height = $derived(52 * scale);
</script>

<svg
  {width}
  {height}
  viewBox="0 0 40 52"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  style="overflow: visible;"
>
  {#if bobDelay !== null}
    <g class="t-bob" style="animation-delay: {bobDelay}s;">
      {#if empty}
        <rect
          x="11"
          y="3"
          width="18"
          height="6"
          rx="1.5"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          stroke-width="1"
          stroke-dasharray="2 2"
        />
        <path
          d="M 5 16 Q 5 11 10 11 L 30 11 Q 35 11 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
          fill="rgba(255,255,255,0.025)"
          stroke="rgba(255,255,255,0.18)"
          stroke-width="1"
          stroke-dasharray="3 3"
        />
      {:else}
        <rect x="10" y="2" width="20" height="7" rx="1.5" fill="#2a2f4a" />
        <rect x="10" y="2" width="20" height="2" fill="rgba(255,255,255,0.18)" />
        <rect x="10" y="7" width="20" height="2" fill="rgba(0,0,0,0.25)" />
        <rect x="12" y="9" width="16" height="3" fill={dark} />
        <path
          d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
          fill={hex}
        />
        <path
          d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 18 L 5 18 Z"
          fill="rgba(0,0,0,0.18)"
        />
        <ellipse cx="13" cy="30" rx="2.5" ry="11" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="13" cy="30" rx="1" ry="9" fill="rgba(255,255,255,0.4)" />
        <rect x="9" y="28" width="22" height="10" fill="rgba(255,255,255,0.08)" />
        <rect x="9" y="28" width="22" height="1" fill="rgba(255,255,255,0.15)" />
        <rect x="9" y="37" width="22" height="1" fill="rgba(0,0,0,0.15)" />
        <path
          d="M 5 44 L 35 44 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
          fill="rgba(0,0,0,0.2)"
        />
      {/if}
    </g>
  {:else if empty}
    <rect
      x="11"
      y="3"
      width="18"
      height="6"
      rx="1.5"
      fill="none"
      stroke="rgba(255,255,255,0.18)"
      stroke-width="1"
      stroke-dasharray="2 2"
    />
    <path
      d="M 5 16 Q 5 11 10 11 L 30 11 Q 35 11 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
      fill="rgba(255,255,255,0.025)"
      stroke="rgba(255,255,255,0.18)"
      stroke-width="1"
      stroke-dasharray="3 3"
    />
  {:else}
    <rect x="10" y="2" width="20" height="7" rx="1.5" fill="#2a2f4a" />
    <rect x="10" y="2" width="20" height="2" fill="rgba(255,255,255,0.18)" />
    <rect x="10" y="7" width="20" height="2" fill="rgba(0,0,0,0.25)" />
    <rect x="12" y="9" width="16" height="3" fill={dark} />
    <path
      d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
      fill={hex}
    />
    <path
      d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 18 L 5 18 Z"
      fill="rgba(0,0,0,0.18)"
    />
    <ellipse cx="13" cy="30" rx="2.5" ry="11" fill="rgba(255,255,255,0.3)" />
    <ellipse cx="13" cy="30" rx="1" ry="9" fill="rgba(255,255,255,0.4)" />
    <rect x="9" y="28" width="22" height="10" fill="rgba(255,255,255,0.08)" />
    <rect x="9" y="28" width="22" height="1" fill="rgba(255,255,255,0.15)" />
    <rect x="9" y="37" width="22" height="1" fill="rgba(0,0,0,0.15)" />
    <path d="M 5 44 L 35 44 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z" fill="rgba(0,0,0,0.2)" />
  {/if}
</svg>
