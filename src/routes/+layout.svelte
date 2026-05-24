<script lang="ts">
  import { onMount } from 'svelte';
  import '$lib/styles/app.css';
  import Snackbar from '$lib/components/Snackbar.svelte';
  import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte';
  import { i18n } from '$lib/i18n/index.svelte';

  let { children } = $props();

  onMount(() => i18n.initFromBrowser());
</script>

<div class="locale-corner">
  <LocaleSwitcher />
</div>

{@render children()}
<Snackbar />

<style>
  .locale-corner {
    position: fixed;
    top: 14px;
    inset-inline-end: 14px;
    z-index: 90;
  }
</style>
