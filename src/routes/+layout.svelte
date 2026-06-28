<script lang="ts">
  import { onMount } from 'svelte';
  import '$lib/styles/app.css';
  import Snackbar from '$lib/components/Snackbar.svelte';
  import { i18n } from '$lib/i18n/index.svelte';

  let { children } = $props();

  // LocaleSwitcher used to live here fixed-positioned, but it overlapped tool
  // headers. It now sits inside each route's <PageHeader> action row.
  onMount(() => {
    i18n.initFromBrowser();
    // After a new deploy, GitHub Pages rotates the hashed `_app/immutable` chunks,
    // so a tab left open on the old build 404s when it lazy-loads a chunk (e.g. the
    // Excel export). Vite fires `vite:preloadError`; reload once to pick up the new
    // build. (Collab survives: the host marker is in sessionStorage; a guest rejoins
    // from the link hash.) A one-shot flag guards against reload loops.
    const KEY = 'wos-reloaded-for-chunk';
    sessionStorage.removeItem(KEY); // a clean load clears the guard
    const onPreloadError = (e: Event) => {
      e.preventDefault();
      if (sessionStorage.getItem(KEY) === '1') return;
      sessionStorage.setItem(KEY, '1');
      location.reload();
    };
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  });
</script>

{@render children()}
<Snackbar />
