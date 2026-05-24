// Static adapter: prerender everything.
export const prerender = true;
// No SSR needed — this is a static SPA.
export const ssr = true;
// No trailing slash on URLs (cleaner): /wos/slush instead of /wos/slush/.
// adapter-static emits `slush.html` rather than `slush/index.html`; GitHub
// Pages auto-resolves the .html extension so the bare URL works.
export const trailingSlash = 'never';
