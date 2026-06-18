<script lang="ts" module>
  /**
   * Colored emoji icons rendered as SVG (Google Noto) via Iconify's offline
   * renderer — same look as the emojis we like, but identical on every device
   * (real emoji glyphs diverge per OS/font). Tree-shaken: only the glyphs
   * imported below ship in the bundle.
   *
   * Add a glyph: find its name at https://icon-sets.iconify.design/noto/ ,
   * import `@iconify-icons/noto/<name>`, add it to the map.
   */
  import OfflineIcon, { addIcon } from '@iconify/svelte/dist/OfflineIcon.svelte';
  // resources
  import cutOfMeat from '@iconify-icons/noto/cut-of-meat';
  import wood from '@iconify-icons/noto/wood';
  import pick from '@iconify-icons/noto/pick';
  import gear from '@iconify-icons/noto/gear';
  import gemStone from '@iconify-icons/noto/gem-stone';
  import coin from '@iconify-icons/noto/coin';
  import fire from '@iconify-icons/noto/fire';
  import sparkles from '@iconify-icons/noto/sparkles';
  import smallOrangeDiamond from '@iconify-icons/noto/small-orange-diamond';
  import nutAndBolt from '@iconify-icons/noto/nut-and-bolt';
  import testTube from '@iconify-icons/noto/test-tube';
  import scroll from '@iconify-icons/noto/scroll';
  import yellowCircle from '@iconify-icons/noto/yellow-circle';
  import pageWithCurl from '@iconify-icons/noto/page-with-curl';
  import closedBook from '@iconify-icons/noto/closed-book';
  import notebookCover from '@iconify-icons/noto/notebook-with-decorative-cover';
  import poultryLeg from '@iconify-icons/noto/poultry-leg';
  import openBook from '@iconify-icons/noto/open-book';
  import alembic from '@iconify-icons/noto/alembic';
  import syringe from '@iconify-icons/noto/syringe';
  import brightButton from '@iconify-icons/noto/bright-button';
  import militaryMedal from '@iconify-icons/noto/military-medal';
  import wrench from '@iconify-icons/noto/wrench';
  import tridentEmblem from '@iconify-icons/noto/trident-emblem';
  import diamondWithDot from '@iconify-icons/noto/diamond-with-a-dot';
  import radioButton from '@iconify-icons/noto/radio-button';
  import star from '@iconify-icons/noto/star';
  import largeBlueDiamond from '@iconify-icons/noto/large-blue-diamond';
  import books from '@iconify-icons/noto/books';
  // sections + troops
  import shoppingCart from '@iconify-icons/noto/shopping-cart';
  import chartIncreasing from '@iconify-icons/noto/chart-increasing';
  import shield from '@iconify-icons/noto/shield';
  import prayerBeads from '@iconify-icons/noto/prayer-beads';
  import highVoltage from '@iconify-icons/noto/high-voltage';
  import bowAndArrow from '@iconify-icons/noto/bow-and-arrow';
  import toolbox from '@iconify-icons/noto/toolbox';

  const icons = {
    'cut-of-meat': cutOfMeat,
    wood,
    pick,
    gear,
    'gem-stone': gemStone,
    coin,
    fire,
    sparkles,
    'small-orange-diamond': smallOrangeDiamond,
    'nut-and-bolt': nutAndBolt,
    'test-tube': testTube,
    scroll,
    'yellow-circle': yellowCircle,
    'page-with-curl': pageWithCurl,
    'closed-book': closedBook,
    'notebook-with-decorative-cover': notebookCover,
    'poultry-leg': poultryLeg,
    'open-book': openBook,
    alembic,
    syringe,
    'bright-button': brightButton,
    'military-medal': militaryMedal,
    wrench,
    'trident-emblem': tridentEmblem,
    'diamond-with-a-dot': diamondWithDot,
    'radio-button': radioButton,
    star,
    'large-blue-diamond': largeBlueDiamond,
    books,
    'shopping-cart': shoppingCart,
    'chart-increasing': chartIncreasing,
    shield,
    'prayer-beads': prayerBeads,
    'high-voltage': highVoltage,
    'bow-and-arrow': bowAndArrow,
    toolbox
  } as const;
  for (const [name, data] of Object.entries(icons)) addIcon(`noto:${name}`, data);

  export type EmojiName = keyof typeof icons;
  export function hasEmoji(name: string): name is EmojiName {
    return name in icons;
  }
</script>

<script lang="ts">
  interface Props {
    name: EmojiName;
    /** Pixel size — width and height equal. Default 18. */
    size?: number;
    /** Resource accent colour — adds a coloured glow behind the icon. */
    color?: string;
  }
  let { name, size = 18, color }: Props = $props();
</script>

<span class="emoji" class:glow={!!color} style={color ? `--c: ${color}` : ''}>
  <OfflineIcon icon="noto:{name}" width={size} height={size} aria-hidden="true" />
</span>

<style>
  .emoji {
    display: inline-flex;
    vertical-align: middle;
    line-height: 1;
  }
  /* Two-layer bloom (tight core + soft halo) so the flat Noto glyph pops like
   * the glossy OS emoji did. Tinted by the resource colour. */
  .emoji.glow {
    filter: drop-shadow(0 0 2px color-mix(in srgb, var(--c) 55%, transparent))
      drop-shadow(0 0 7px color-mix(in srgb, var(--c) 26%, transparent));
  }
</style>
