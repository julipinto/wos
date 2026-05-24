<script lang="ts" module>
  /**
   * Icon wrapper for Lucide via @iconify/svelte (offline build).
   *
   * Why this setup:
   * - `@iconify/svelte/dist/OfflineIcon.svelte` skips the public Iconify HTTP
   *   API so icons render correctly during static prerender.
   * - `@iconify-icons/lucide/<name>` ships ONE icon per JSON file, which Vite
   *   tree-shakes — so the bundle only carries the glyphs we actually
   *   reference (not the full ~1700-icon Lucide set, which is ~600 kB).
   *
   * To add a glyph:
   *   1. Find the kebab-case name at https://lucide.dev/icons
   *   2. Add the import + an entry in the map below
   *   3. Use it: <Icon name="your-name" />
   */
  import OfflineIcon, { addIcon } from '@iconify/svelte/dist/OfflineIcon.svelte';

  import arrowLeft from '@iconify-icons/lucide/arrow-left';
  import arrowRight from '@iconify-icons/lucide/arrow-right';
  import check from '@iconify-icons/lucide/check';
  import chevronDown from '@iconify-icons/lucide/chevron-down';
  // Note: this package predates the lucide rename; help/check live under
  // "help-circle" / "check-circle" rather than the current "circle-*".
  import circleCheck from '@iconify-icons/lucide/check-circle';
  import circleHelp from '@iconify-icons/lucide/help-circle';
  import copy from '@iconify-icons/lucide/copy';
  import globe from '@iconify-icons/lucide/globe';
  import gripVertical from '@iconify-icons/lucide/grip-vertical';
  import languages from '@iconify-icons/lucide/languages';
  import lightbulb from '@iconify-icons/lucide/lightbulb';
  import minus from '@iconify-icons/lucide/minus';
  import plus from '@iconify-icons/lucide/plus';
  import rotateCcw from '@iconify-icons/lucide/rotate-ccw';
  import settings from '@iconify-icons/lucide/settings';
  import x from '@iconify-icons/lucide/x';

  const icons = {
    'arrow-left': arrowLeft,
    'arrow-right': arrowRight,
    check,
    'chevron-down': chevronDown,
    'circle-check': circleCheck,
    'circle-help': circleHelp,
    copy,
    globe,
    'grip-vertical': gripVertical,
    languages,
    lightbulb,
    minus,
    plus,
    'rotate-ccw': rotateCcw,
    settings,
    x
  } as const;

  // Register under the standard `lucide:` prefix so <OfflineIcon> can resolve
  // by name. Iconify's addIcon is idempotent.
  for (const [name, data] of Object.entries(icons)) {
    addIcon(`lucide:${name}`, data);
  }

  export type IconName = keyof typeof icons;
  export function hasIcon(name: string): name is IconName {
    return name in icons;
  }
</script>

<script lang="ts">
  interface Props {
    name: IconName;
    /** Pixel size — width and height equal. Default 16. */
    size?: number;
    /** Extra class for the SVG. */
    class?: string;
  }

  let { name, size = 16, class: cls = '' }: Props = $props();
</script>

<OfflineIcon icon="lucide:{name}" width={size} height={size} class={cls} aria-hidden="true" />
