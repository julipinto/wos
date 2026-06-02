/** Gingado tutorial slide illustrations. Titles/captions come from i18n; these
 * functions return inner SVG markup. See STYLE_GUIDE.md "SVG transform gotcha":
 * inner <g class="t-*"> must nest inside an outer positioning <g>. */

const CY = '#93d4ff';
const CY_DIM = 'rgba(147,212,255,0.5)';

function pot(x: number, w: number, jp: boolean): string {
  const fill = jp ? 'rgba(255,209,102,0.16)' : 'rgba(147,212,255,0.08)';
  const stroke = jp ? 'rgba(255,209,102,0.5)' : CY_DIM;
  return `<rect x="${x}" y="128" width="${w}" height="34" rx="4" fill="${fill}" stroke="${stroke}"/>`;
}

export function vWelcome(): string {
  const pots = [10, 70, 130, 500, 130, 70, 10];
  let bins = '';
  const x0 = 56;
  const w = 30;
  for (let i = 0; i < 7; i++) {
    const x = x0 + i * (w + 1);
    bins += pot(x, w, i === 3);
    const c = i === 3 ? '#ffd166' : 'rgba(255,255,255,0.55)';
    bins += `<text x="${x + w / 2}" y="149" text-anchor="middle" font-family="'DM Mono', monospace" font-size="9" fill="${c}">${pots[i]}</text>`;
  }
  let pins = '';
  for (const [px, py] of [
    [110, 60],
    [160, 56],
    [210, 60],
    [135, 86],
    [185, 86],
    [160, 110]
  ] as const) {
    pins += `<circle cx="${px}" cy="${py}" r="4" fill="rgba(205,233,255,0.6)"/>`;
  }
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <text x="120" y="32" font-size="20">🐧</text>
    <text x="155" y="32" font-size="20">🐧</text>
    <text x="190" y="32" font-size="20">🐧</text>
    ${pins}
    ${bins}
    <g class="t-fall">
      <circle cx="160" cy="40" r="5" fill="#fff"/>
    </g>
  </svg>`;
}

export function vWobble(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <text x="150" y="44" font-size="26">🐧</text>
    <path d="M160 40 L120 150 L200 150 Z" fill="rgba(147,212,255,0.10)"/>
    <line x1="160" y1="40" x2="160" y2="150" stroke="${CY_DIM}" stroke-width="1.4" stroke-dasharray="4 5"/>
    <g class="t-swing" style="transform-origin: 160px 44px;">
      <line x1="160" y1="44" x2="160" y2="150" stroke="${CY}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="160" cy="150" r="5" fill="#fff"/>
    </g>
  </svg>`;
}

export function vEdit(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <rect x="36" y="28" width="248" height="120" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)"/>
    <circle cx="120" cy="70" r="11" fill="rgba(205,233,255,0.5)" stroke="${CY}" stroke-width="1.4"/>
    <circle cx="200" cy="100" r="20" fill="rgba(255,209,102,0.18)" stroke="rgba(255,209,102,0.6)" stroke-width="1.4"/>
    <line x1="150" y1="60" x2="190" y2="50" stroke="${CY}" stroke-width="8" stroke-linecap="round" opacity="0.7"/>
    <circle cx="150" cy="60" r="3.5" fill="#fff"/>
    <circle cx="190" cy="50" r="3.5" fill="#fff"/>
    <g class="t-nudge" style="transform-origin: 120px 70px;">
      <path d="M120 70 m -14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-dasharray="3 3"/>
    </g>
  </svg>`;
}

export function vSimulate(): string {
  const heights = [16, 34, 58, 84, 56, 32, 14];
  let bars = '';
  const x0 = 60;
  const w = 26;
  for (let i = 0; i < 7; i++) {
    const x = x0 + i * (w + 2);
    const h = heights[i];
    const jp = i === 3;
    bars += `<rect x="${x}" y="${132 - h}" width="${w}" height="${h}" rx="3" fill="${jp ? 'rgba(255,209,102,0.55)' : 'rgba(147,212,255,0.45)'}"/>`;
  }
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <text x="160" y="40" text-anchor="middle" font-family="'Fraunces', serif" font-style="italic" font-weight="800" font-size="30" fill="${CY}">EV 121</text>
    ${bars}
    <line x1="56" y1="132" x2="262" y2="132" stroke="rgba(255,255,255,0.12)"/>
  </svg>`;
}

export const GINGADO_SLIDES = [
  { svg: vWelcome },
  { svg: vWobble },
  { svg: vEdit },
  { svg: vSimulate }
];
