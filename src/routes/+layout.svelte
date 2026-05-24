<script lang="ts">
  import { onMount } from 'svelte';
  import '$lib/styles/app.css';
  import Snackbar from '$lib/components/Snackbar.svelte';
  import { i18n } from '$lib/i18n/index.svelte';

  let { children } = $props();

  // LocaleSwitcher used to live here fixed-positioned, but it overlapped tool
  // headers. It now sits inside each route's <PageHeader> action row.
  onMount(() => i18n.initFromBrowser());
</script>

{@render children()}
<Snackbar />
