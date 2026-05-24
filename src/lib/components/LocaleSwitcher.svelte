<script lang="ts">
  import { i18n, SUPPORTED_LOCALES, LOCALE_NAMES, type Locale } from '$lib/i18n/index.svelte';
</script>

<label class="switcher" aria-label="Language">
  <span class="sr">Language</span>
  <select
    value={i18n.locale}
    onchange={(e) => i18n.setLocale((e.currentTarget as HTMLSelectElement).value as Locale)}
  >
    {#each SUPPORTED_LOCALES as code (code)}
      <option value={code}>{LOCALE_NAMES[code]}</option>
    {/each}
  </select>
</label>

<style>
  .switcher {
    display: inline-flex;
    align-items: center;
  }
  select {
    appearance: none;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 6px 12px;
    border-radius: var(--r-pill);
    cursor: pointer;
  }
  select:hover {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
