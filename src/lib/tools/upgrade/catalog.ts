/**
 * Hub catalogue — the cards on /upgrade. Each card points at one calculator.
 *
 * `status` drives how a card renders and whether it's reachable:
 *   - 'available' — data cross-checked & verified; normal link.
 *   - 'preview'   — built but data not yet verified; link + a "preview" tag.
 *   - 'soon'      — planned, no screen yet; rendered as a disabled ghost card.
 *
 * Per the project rule (hide unverified data), `SHOW_PREVIEWS` gates whether
 * 'preview' cards are reachable at all. It's on now so the foundation is
 * reviewable; flip it off and preview cards collapse to 'soon' for real users.
 */

export type CardStatus = 'available' | 'preview' | 'soon';

export interface HubCard {
  id: string;
  /** Route relative to `base`, e.g. '/upgrade/buildings'. */
  route: string;
  /** Emoji icon (placeholder for future sprites). */
  icon: string;
  /** i18n suffix under `upgrade.cat.*`. */
  i18n: string;
  status: CardStatus;
}

/** While true, 'preview' cards are clickable. Set false to honour hide-until-verified. */
export const SHOW_PREVIEWS = true;

export const HUB_CARDS: HubCard[] = [
  { id: 'plan', route: '/upgrade/plan', icon: '📋', i18n: 'plan', status: 'available' },
  {
    id: 'buildings',
    route: '/upgrade/buildings',
    icon: '🏭',
    i18n: 'buildings',
    status: 'available'
  },
  { id: 'gear', route: '/upgrade/gear', icon: '⚔️', i18n: 'gear', status: 'available' },
  { id: 'charms', route: '/upgrade/charms', icon: '📿', i18n: 'charms', status: 'available' },
  { id: 'troops', route: '/upgrade/troops', icon: '🪖', i18n: 'troops', status: 'available' },
  { id: 'research', route: '/upgrade/research', icon: '🔬', i18n: 'research', status: 'preview' },
  { id: 'helios', route: '/upgrade/helios', icon: '🔆', i18n: 'helios', status: 'preview' },
  { id: 'pets', route: '/upgrade/pets', icon: '🐺', i18n: 'pets', status: 'available' },
  { id: 'experts', route: '/upgrade/experts', icon: '🎓', i18n: 'experts', status: 'preview' },
  { id: 'heroes', route: '/upgrade/heroes', icon: '🦸', i18n: 'heroes', status: 'available' }
];

/** Effective status after applying the preview gate. */
export function effectiveStatus(card: HubCard): CardStatus {
  if (card.status === 'preview' && !SHOW_PREVIEWS) return 'soon';
  return card.status;
}
