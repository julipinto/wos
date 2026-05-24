<script lang="ts" module>
  /**
   * Lucide-style icon set (MIT, https://lucide.dev/).
   *
   * Why custom and not @iconify/svelte or unplugin-icons: the current
   * iconify packages depend on @iconify/utils, which imports
   * `node:util.styleText` — only available in Node 22+. Keeping this
   * project Node 21-friendly (the developer's default), so we ship the
   * subset of Lucide we actually use as inline SVG path strings.
   *
   * To add a new icon, copy the inner SVG (children of <svg>) from
   * https://lucide.dev/icons/<name> and paste it as `body` below.
   * All Lucide icons use a 24×24 viewBox.
   */
  export type IconName =
    | 'arrow-left'
    | 'arrow-right'
    | 'check'
    | 'chevron-down'
    | 'circle-check'
    | 'circle-help'
    | 'copy'
    | 'globe'
    | 'grip-vertical'
    | 'languages'
    | 'lightbulb'
    | 'minus'
    | 'plus'
    | 'rotate-ccw'
    | 'settings'
    | 'x';

  const icons: Record<IconName, string> = {
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'circle-check':
      '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'circle-help':
      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    copy:
      '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    globe:
      '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20a14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    'grip-vertical':
      '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    languages:
      '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    lightbulb:
      '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    'rotate-ccw':
      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    settings:
      '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };

  export function hasIcon(name: string): name is IconName {
    return name in icons;
  }
</script>

<script lang="ts">
  interface Props {
    name: IconName;
    /** Pixel size — width and height equal. Default 16. */
    size?: number;
    /** Stroke width in user-units (24×24 viewBox). Default 1.5 — matches style guide. */
    strokeWidth?: number;
    /** Extra class for the <svg>. */
    class?: string;
  }

  let { name, size = 16, strokeWidth = 1.5, class: cls = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={cls}
  aria-hidden="true"
>
  {@html icons[name]}
</svg>
