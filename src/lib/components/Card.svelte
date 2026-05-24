<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    ghost?: boolean;
    children: Snippet;
  }

  let { href, ghost = false, children }: Props = $props();
</script>

{#if href && !ghost}
  <a {href} class="card" class:ghost>
    {@render children()}
  </a>
{:else}
  <div class="card" class:ghost>
    {@render children()}
  </div>
{/if}

<style>
  .card {
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 22px 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    color: inherit;
    text-decoration: none;
    transition:
      background 0.25s ease,
      border-color 0.25s ease,
      transform 0.25s ease,
      box-shadow 0.25s ease;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 240px 120px at 0% 50%,
      rgba(147, 212, 255, 0.08),
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  a.card:hover {
    background: var(--surface-hover);
    border-color: var(--border-accent);
    transform: translateY(-2px);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35);
  }
  a.card:hover::before {
    opacity: 1;
  }
  .ghost {
    background: transparent;
    border-style: dashed;
    border-color: rgba(255, 255, 255, 0.07);
    cursor: default;
  }
</style>
