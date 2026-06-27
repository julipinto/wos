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
  import circle from '@iconify-icons/lucide/circle';
  import circleCheck from '@iconify-icons/lucide/check-circle';
  import circleDot from '@iconify-icons/lucide/circle-dot';
  import circleHelp from '@iconify-icons/lucide/help-circle';
  import clipboardList from '@iconify-icons/lucide/clipboard-list';
  import copy from '@iconify-icons/lucide/copy';
  import crown from '@iconify-icons/lucide/crown';
  import download from '@iconify-icons/lucide/download';
  import gitCompare from '@iconify-icons/lucide/git-compare';
  import globe from '@iconify-icons/lucide/globe';
  import gripVertical from '@iconify-icons/lucide/grip-vertical';
  import image from '@iconify-icons/lucide/image';
  import languages from '@iconify-icons/lucide/languages';
  import lightbulb from '@iconify-icons/lucide/lightbulb';
  import minus from '@iconify-icons/lucide/minus';
  import move from '@iconify-icons/lucide/move';
  import play from '@iconify-icons/lucide/play';
  import plus from '@iconify-icons/lucide/plus';
  import rotateCcw from '@iconify-icons/lucide/rotate-ccw';
  import settings from '@iconify-icons/lucide/settings';
  import share2 from '@iconify-icons/lucide/share-2';
  import slash from '@iconify-icons/lucide/slash';
  import target from '@iconify-icons/lucide/target';
  import trash2 from '@iconify-icons/lucide/trash-2';
  import upload from '@iconify-icons/lucide/upload';
  import x from '@iconify-icons/lucide/x';
  import zap from '@iconify-icons/lucide/zap';

  const icons = {
    'arrow-left': arrowLeft,
    'arrow-right': arrowRight,
    check,
    'chevron-down': chevronDown,
    circle,
    'circle-check': circleCheck,
    'circle-dot': circleDot,
    'circle-help': circleHelp,
    'clipboard-list': clipboardList,
    copy,
    crown,
    download,
    'git-compare': gitCompare,
    globe,
    'grip-vertical': gripVertical,
    image,
    languages,
    lightbulb,
    minus,
    move,
    play,
    plus,
    'rotate-ccw': rotateCcw,
    settings,
    'share-2': share2,
    slash,
    target,
    'trash-2': trash2,
    upload,
    x,
    zap
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
