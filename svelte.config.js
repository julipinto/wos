import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// On GitHub Pages, the app is served from `https://<user>.github.io/wos/`,
// so SvelteKit needs a non-empty `paths.base`. Locally we want `''`.
// `BASE_PATH` is set by the deploy workflow; default to empty for dev/preview.
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    paths: {
      base
    },
    prerender: {
      handleHttpError: 'warn'
    }
  }
};

export default config;
