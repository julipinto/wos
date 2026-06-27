/**
 * Slide artwork for the territory planner tutorial (consumed by the shared
 * Tutorial component). Each function returns inline SVG markup (320×175) using
 * the app's object palette so the slides match the board. The artwork labels
 * stay in English (like the board's own UI chrome); the localised explanation
 * lives in each slide's caption.
 */
const HQ = '#93d4ff';
const BANNER = '#fbbf24';
const CITY = '#4ade80';
const BEAR = '#fb7185';
const GOLD = '#fbbf24';
const MONO = "'DM Mono', monospace";

const tile = (x: number, y: number, w: number, h: number, c: string, op = 0.85): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" fill-opacity="${op}" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>`;

const floor = (): string =>
  `<rect x="20" y="14" width="280" height="148" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>`;

const note = (x: number, y: number, text: string, op = 0.55): string =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="rgba(255,255,255,${op})">${text}</text>`;

export function vWelcome(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    ${tile(132, 52, 56, 56, HQ)}
    <text x="160" y="84" text-anchor="middle" font-family="${MONO}" font-size="11" fill="rgba(0,0,0,0.6)" font-weight="700">HQ</text>
    ${tile(108, 40, 8, 8, BANNER)}${tile(204, 40, 8, 8, BANNER)}${tile(108, 116, 8, 8, BANNER)}${tile(204, 116, 8, 8, BANNER)}
    ${tile(70, 70, 18, 18, CITY)}${tile(70, 92, 18, 18, CITY)}${tile(234, 70, 18, 18, CITY)}${tile(234, 92, 18, 18, CITY)}
    ${tile(150, 124, 20, 20, BEAR)}
    <text x="160" y="138" text-anchor="middle" font-family="${MONO}" font-size="10" fill="rgba(0,0,0,0.6)" font-weight="800">1</text>
  </svg>`;
}

export function vModes(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <rect x="60" y="34" width="200" height="34" rx="17" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>
    <rect x="63" y="37" width="98" height="28" rx="14" fill="rgba(147,212,255,0.16)" stroke="rgba(147,212,255,0.5)"/>
    <text x="112" y="55" text-anchor="middle" font-family="${MONO}" font-size="12" fill="#ffffff">✏️ Edit</text>
    <text x="210" y="55" text-anchor="middle" font-family="${MONO}" font-size="12" fill="rgba(255,255,255,0.6)">🖐 View</text>
    <text x="160" y="100" text-anchor="middle" font-family="'Fraunces', serif" font-style="italic" font-weight="600" font-size="14" fill="rgba(255,255,255,0.85)">Edit places &amp; moves</text>
    <text x="160" y="128" text-anchor="middle" font-family="${MONO}" font-size="11" fill="rgba(255,255,255,0.55)">View drags to pan around</text>
    <text x="160" y="146" text-anchor="middle" font-family="${MONO}" font-size="10" fill="rgba(255,255,255,0.4)">(two fingers pan in Edit too)</text>
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
    ${note(74, 120, 'tap to place', 0.6)}
    ${note(170, 120, 'drag to move', 0.6)}
    <text x="261" y="120" text-anchor="middle" font-family="${MONO}" font-size="10" fill="rgba(251,113,133,0.85)">no overlap</text>
    ${note(160, 150, 'box-select several · double-tap removes', 0.4)}
  </svg>`;
}

// A labelled field row inside a mock editor card.
const field = (y: number, label: string, value: string): string =>
  `<text x="140" y="${y + 9}" font-family="${MONO}" font-size="8" fill="rgba(255,255,255,0.45)" letter-spacing="1">${label}</text>
   <rect x="204" y="${y}" width="70" height="14" rx="7" fill="rgba(147,212,255,0.12)" stroke="rgba(147,212,255,0.35)"/>
   <text x="239" y="${y + 10}" text-anchor="middle" font-family="${MONO}" font-size="8" fill="#cfe8ff">${value}</text>`;

export function vTagCity(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    ${tile(46, 60, 52, 52, CITY)}
    ${note(72, 126, 'a city', 0.5)}
    <rect x="124" y="36" width="164" height="104" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>
    ${field(48, 'NAME', 'Alexis')}
    ${field(70, 'ID', '21712…')}
    ${field(92, 'FURNACE', 'FC7')}
    ${field(114, 'POWER', '484M')}
  </svg>`;
}

export function vBears(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    ${tile(64, 44, 32, 32, BEAR)}
    <text x="80" y="64" text-anchor="middle" font-family="${MONO}" font-size="12" fill="#fff" font-weight="800">1</text>
    <text x="98" y="44" text-anchor="middle" font-family="${MONO}" font-size="14" fill="${GOLD}">★</text>
    ${tile(160, 44, 32, 32, BEAR)}
    <text x="176" y="64" text-anchor="middle" font-family="${MONO}" font-size="12" fill="#fff" font-weight="800">2</text>
    ${tile(104, 102, 22, 22, CITY)}
    <rect x="140" y="103" width="78" height="20" rx="10" fill="rgba(251,113,133,0.16)" stroke="rgba(251,113,133,0.5)"/>
    <text x="179" y="116" text-anchor="middle" font-family="${MONO}" font-size="10" fill="#fff">🐻 ★1 · 2</text>
    ${note(160, 150, '★ primary trap · others are backup', 0.5)}
  </svg>`;
}

export function vInsights(): string {
  const heat = [0.95, 0.75, 0.55, 0.38];
  const row = heat.map((op, i) => tile(56 + i * 30, 58, 24, 24, CITY, op)).join('');
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    <rect x="92" y="26" width="136" height="22" rx="11" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)"/>
    <circle cx="108" cy="37" r="5" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.4"/>
    <path d="M112 41 L117 46" stroke="rgba(255,255,255,0.55)" stroke-width="1.4" stroke-linecap="round"/>
    <text x="170" y="41" text-anchor="middle" font-family="${MONO}" font-size="10" fill="rgba(255,255,255,0.6)">find a player</text>
    ${row}
    ${tile(190, 58, 24, 24, BEAR, 0.8)}${tile(218, 58, 24, 24, HQ, 0.8)}
    <text x="68" y="104" font-family="${MONO}" font-size="9" fill="rgba(255,255,255,0.5)">heatmap by power</text>
    <text x="190" y="104" font-family="${MONO}" font-size="9" fill="rgba(255,255,255,0.5)">colour by trap</text>
    ${note(160, 150, 'labels · heatmap · colour-by-primary · find', 0.45)}
  </svg>`;
}

// A live cursor with a coloured name tag.
const cursor = (x: number, y: number, color: string, name: string): string => {
  const w = name.length * 6 + 12;
  return `<g transform="translate(${x},${y})">
    <path d="M0 0 L0 17 L4.5 12.5 L8 20 L11 18.5 L7.5 11 L13 11 Z" fill="${color}" stroke="#0b0e16" stroke-width="0.7"/>
    <rect x="12" y="11" width="${w}" height="15" rx="7.5" fill="${color}"/>
    <text x="${12 + w / 2}" y="21.5" text-anchor="middle" font-family="${MONO}" font-size="8" font-weight="700" fill="#0b0e16">${name}</text>
  </g>`;
};

export function vCollab(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    ${floor()}
    <rect x="186" y="24" width="100" height="22" rx="11" fill="rgba(74,222,128,0.12)" stroke="rgba(74,222,128,0.4)"/>
    <circle cx="202" cy="35" r="4" fill="#4ade80"/>
    <text x="248" y="39" text-anchor="middle" font-family="${MONO}" font-size="10" fill="rgba(255,255,255,0.7)">2 online</text>
    ${tile(74, 70, 30, 30, CITY)}${tile(150, 86, 30, 30, CITY, 0.6)}
    ${cursor(96, 78, HQ, 'Juli')}
    ${cursor(168, 96, BEAR, 'Ana')}
    ${note(160, 150, 'edit the same hive together, live', 0.5)}
  </svg>`;
}

// A pill chip used in the share/export columns.
const chip = (x: number, y: number, text: string): string =>
  `<rect x="${x}" y="${y}" width="96" height="22" rx="11" fill="rgba(147,212,255,0.10)" stroke="rgba(147,212,255,0.4)"/>
   <text x="${x + 48}" y="${y + 15}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="#cfe8ff">${text}</text>`;

export function vShareExport(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <rect x="26" y="34" width="124" height="110" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.09)"/>
    <text x="88" y="52" text-anchor="middle" font-family="${MONO}" font-size="9" letter-spacing="2" fill="rgba(255,255,255,0.5)">SHARE</text>
    ${chip(40, 64, '🔗 link')}
    ${chip(40, 92, '⧉ code')}
    ${chip(40, 120, '⬇ file')}
    <rect x="170" y="34" width="124" height="110" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.09)"/>
    <text x="232" y="52" text-anchor="middle" font-family="${MONO}" font-size="9" letter-spacing="2" fill="rgba(255,255,255,0.5)">EXPORT</text>
    ${chip(184, 64, '🖼 PNG')}
    ${chip(184, 92, '✏️ draw.io')}
    ${chip(184, 120, '📊 xlsx')}
  </svg>`;
}

export const TERRITORY_SLIDES = [
  vWelcome,
  vModes,
  vPlaceMove,
  vTagCity,
  vBears,
  vInsights,
  vCollab,
  vShareExport
];
