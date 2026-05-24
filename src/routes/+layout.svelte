<script lang="ts">
  import '$lib/styles/app.css';
  import Snackbar from '$lib/components/Snackbar.svelte';

  let { children } = $props();
</script>

{@render children()}
<Snackbar />
