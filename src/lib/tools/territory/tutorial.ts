/**
 * Slide artwork for the territory planner tutorial (consumed by the shared
 * Tutorial component). Each function returns inline SVG markup (320×175) using
 * the app's object palette so the slides match the board.
 */
const HQ = '#93d4ff';
const BANNER = '#fbbf24';
const CITY = '#4ade80';
const BEAR = '#fb7185';

const tile = (x: number, y: number, w: number, h: number, c: string, op = 0.85): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" fill-opacity="${op}" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>`;

const floor = (): string =>
  `<rect x="20" y="14" width="280" height="148" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>`;

export function vWelcome(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    ${tile(132, 52, 56, 56, HQ)}
    <text x="160" y="84" text-anchor="middle" font-family="'DM Mono', monospace" font-size="11" fill="rgba(0,0,0,0.6)" font-weight="700">HQ</text>
    ${tile(108, 40, 8, 8, BANNER)}${tile(204, 40, 8, 8, BANNER)}${tile(108, 116, 8, 8, BANNER)}${tile(204, 116, 8, 8, BANNER)}
    ${tile(70, 70, 18, 18, CITY)}${tile(70, 92, 18, 18, CITY)}${tile(234, 70, 18, 18, CITY)}${tile(234, 92, 18, 18, CITY)}
    ${tile(150, 124, 20, 20, BEAR)}
    <text x="160" y="138" text-anchor="middle" font-family="'DM Mono', monospace" font-size="10" fill="rgba(0,0,0,0.6)" font-weight="800">1</text>
  </svg>`;
}

export function vModes(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <rect x="60" y="34" width="200" height="34" rx="17" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>
    <rect x="63" y="37" width="98" height="28" rx="14" fill="rgba(147,212,255,0.16)" stroke="rgba(147,212,255,0.5)"/>
    <text x="112" y="55" text-anchor="middle" font-family="'DM Mono', monospace" font-size="12" fill="#ffffff">✏️ Edit</text>
    <text x="210" y="55" text-anchor="middle" font-family="'DM Mono', monospace" font-size="12" fill="rgba(255,255,255,0.6)">🖐 View</text>
    <text x="160" y="100" text-anchor="middle" font-family="'Fraunces', serif" font-style="italic" font-weight="600" font-size="14" fill="rgba(255,255,255,0.85)">Edit places &amp; moves</text>
    <text x="160" y="128" text-anchor="middle" font-family="'DM Mono', monospace" font-size="11" fill="rgba(255,255,255,0.55)">View drags to pan around</text>
    <text x="160" y="146" text-anchor="middle" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.4)">(two fingers pan in Edit too)</text>
  </svg>`;
}

export function vPlaceMove(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    ${tile(56, 56, 36, 36, CITY)}
    <g transform="translate(120,74)">
      <path d="M0 0 H56" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M56 0 L48 -5 M56 0 L48 5" stroke="rgba(255,255,255,0.9)" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
    ${tile(188, 56, 36, 36, CITY, 0.45)}
    <g transform="translate(246,60)">
      <rect x="0" y="0" width="30" height="30" rx="3" fill="${BEAR}" fill-opacity="0.5" stroke="#fb7185" stroke-width="1.4" stroke-dasharray="3 2"/>
      <path d="M7 7 L23 23 M23 7 L7 23" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    </g>
    <text x="74" y="120" text-anchor="middle" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.6)">tap to place</text>
    <text x="170" y="120" text-anchor="middle" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.6)">drag to move</text>
    <text x="261" y="120" text-anchor="middle" font-family="'DM Mono', monospace" font-size="10" fill="rgba(251,113,133,0.85)">no overlap</text>
    <text x="160" y="150" text-anchor="middle" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.4)">double-tap removes</text>
  </svg>`;
}

export function vSelect(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    ${tile(78, 54, 26, 26, CITY)}${tile(120, 54, 26, 26, CITY)}${tile(99, 88, 26, 26, CITY)}
    ${tile(210, 92, 26, 26, BANNER, 0.85)}
    <rect x="66" y="44" width="96" height="84" rx="4" fill="rgba(147,212,255,0.12)" stroke="#93d4ff" stroke-width="1.4" stroke-dasharray="4 3"/>
    <text x="160" y="150" text-anchor="middle" font-family="'DM Mono', monospace" font-size="11" fill="rgba(255,255,255,0.6)">drag a box to select several · then move them together</text>
  </svg>`;
}

export function vBearsShare(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    ${tile(54, 50, 26, 26, BEAR)}<text x="67" y="68" text-anchor="middle" font-family="'DM Mono', monospace" font-size="12" fill="#fff" font-weight="800">1</text>
    ${tile(150, 50, 26, 26, BEAR)}<text x="163" y="68" text-anchor="middle" font-family="'DM Mono', monospace" font-size="12" fill="#fff" font-weight="800">2</text>
    ${tile(96, 96, 20, 20, CITY)}
    <rect x="120" y="98" width="34" height="16" rx="8" fill="rgba(251,113,133,0.18)" stroke="rgba(251,113,133,0.5)"/>
    <text x="137" y="110" text-anchor="middle" font-family="'DM Mono', monospace" font-size="9" fill="#fff">🐻 1·2</text>
    <g transform="translate(214,92)">
      <rect x="0" y="0" width="72" height="26" rx="13" fill="rgba(147,212,255,0.10)" stroke="rgba(147,212,255,0.45)"/>
      <path d="M14 13 a4 4 0 0 1 4 -4 h6 a4 4 0 0 1 0 8 h-6" fill="none" stroke="#93d4ff" stroke-width="1.6"/>
      <path d="M30 13 a4 4 0 0 1 -4 4 h-6 a4 4 0 0 1 0 -8 h6" fill="none" stroke="#93d4ff" stroke-width="1.6"/>
      <text x="56" y="17" text-anchor="middle" font-family="'DM Mono', monospace" font-size="9" fill="#93d4ff">share</text>
    </g>
    <text x="160" y="150" text-anchor="middle" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.55)">cities join bear traps · share a link or copy the code</text>
  </svg>`;
}

export const TERRITORY_SLIDES = [vWelcome, vModes, vPlaceMove, vSelect, vBearsShare];
