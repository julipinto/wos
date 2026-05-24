<script lang="ts">
  import type { Snippet } from 'svelte';
  import Modal from './Modal.svelte';

  export interface Slide {
    title: string;
    caption: string;
    visual: Snippet;
  }

  interface Props {
    open: boolean;
    onClose: () => void;
    slides: Slide[];
  }

  let { open, onClose, slides }: Props = $props();
  let idx = $state(0);

  $effect(() => {
    if (open) idx = 0;
  });

  let isLast = $derived(idx === slides.length - 1);

  function next() {
    if (isLast) onClose();
    else idx++;
  }
  function back() {
    if (idx > 0) idx--;
  }
</script>

<Modal {open} {onClose} wide label="Tutorial">
  <div class="tour-content">
    {#each slides as slide, i (i)}
      <div class="tour-slide" class:active={i === idx} aria-hidden={i !== idx}>
        <div class="tour-visual">
          {@render slide.visual()}
        </div>
        <h3 class="tour-title">{slide.title}</h3>
        <p class="tour-caption">{slide.caption}</p>
      </div>
    {/each}
  </div>
  <div class="tour-footer">
    <button class="text-btn" onclick={back} disabled={idx === 0}>back</button>
    <div class="dots" role="tablist">
      {#each slides as _, i (i)}
        <button
          class="dot"
          class:active={i === idx}
          aria-label={`Slide ${i + 1}`}
          aria-selected={i === idx}
          role="tab"
          onclick={() => (idx = i)}
        ></button>
      {/each}
    </div>
    <button class="cta" class:final={isLast} onclick={next}>
      {isLast ? 'got it' : 'next'}
      {#if !isLast}
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M5 10 H14 M10 6 L14 10 L10 14"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      {/if}
    </button>
  </div>
</Modal>

<style>
  .tour-content {
    position: relative;
    min-height: 320px;
    margin-bottom: 18px;
  }
  .tour-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.32s ease;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .tour-slide.active {
    opacity: 1;
    pointer-events: auto;
  }
  .tour-visual {
    width: 100%;
    max-width: 360px;
    aspect-ratio: 320 / 175;
    margin-bottom: 22px;
  }
  /* Pause animations in inactive slides — forces them to restart fresh when
   * the slide becomes active. */
  .tour-slide:not(.active) :global(*) {
    animation-play-state: paused !important;
  }
  .tour-title {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 22px;
    margin: 0 0 6px;
    letter-spacing: -0.01em;
  }
  .tour-caption {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-mid);
    margin: 0;
    max-width: 320px;
  }
  .tour-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }
  .text-btn {
    background: transparent;
    border: 0;
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    padding: 8px 4px;
  }
  .text-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .text-btn:hover:not(:disabled) {
    color: var(--text);
  }
  .dots {
    display: flex;
    gap: 8px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    border: 0;
    padding: 0;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .dot.active {
    background: var(--accent);
  }
  .cta {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-radius: var(--r-pill);
    border: 1px solid var(--border-accent);
    background: var(--accent-glow);
    color: var(--text);
    padding: 10px 18px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }
  .cta:hover {
    background: rgba(147, 212, 255, 0.28);
  }
  .cta.final {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
  }
  .cta.final:hover {
    filter: brightness(1.05);
  }
</style>
