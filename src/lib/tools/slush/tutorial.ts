import { shade } from '$lib/utils/format';

function jarInner(hex: string): string {
  const dark = shade(hex, -25);
  return `
    <rect x="10" y="2" width="20" height="7" rx="1.5" fill="#2a2f4a"/>
    <rect x="10" y="2" width="20" height="2" fill="rgba(255,255,255,0.18)"/>
    <rect x="10" y="7" width="20" height="2" fill="rgba(0,0,0,0.25)"/>
    <rect x="12" y="9" width="16" height="3" fill="${dark}"/>
    <path d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z" fill="${hex}"/>
    <path d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 18 L 5 18 Z" fill="rgba(0,0,0,0.18)"/>
    <ellipse cx="13" cy="30" rx="2.5" ry="11" fill="rgba(255,255,255,0.3)"/>
    <ellipse cx="13" cy="30" rx="1" ry="9" fill="rgba(255,255,255,0.4)"/>
    <rect x="9" y="28" width="22" height="10" fill="rgba(255,255,255,0.08)"/>
    <rect x="9" y="28" width="22" height="1" fill="rgba(255,255,255,0.15)"/>
    <rect x="9" y="37" width="22" height="1" fill="rgba(0,0,0,0.15)"/>
    <path d="M 5 44 L 35 44 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z" fill="rgba(0,0,0,0.2)"/>
  `;
}

function slotInner(): string {
  return `
    <rect x="11" y="3" width="18" height="6" rx="1.5" fill="none"
          stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-dasharray="2 2"/>
    <path d="M 5 16 Q 5 11 10 11 L 30 11 Q 35 11 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
          fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-dasharray="3 3"/>
  `;
}

export function vWelcome(): string {
  const colors = ['#ef4444', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc'];
  let svg = `<svg viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg">`;
  colors.forEach((c, i) => {
    const x = 16 + i * 48;
    svg += `<g transform="translate(${x}, 35)"><g class="t-bob" style="animation-delay: ${(i * 0.13).toFixed(2)}s;">${jarInner(c)}</g></g>`;
  });
  svg += `</svg>`;
  return svg;
}

export function vInventory(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(160, 26)">
      <g class="t-pulse">
        <circle r="20" fill="rgba(147,212,255,0.10)" stroke="rgba(147,212,255,0.4)" stroke-width="1"/>
        <g transform="translate(-9, -9)" fill="none" stroke="rgba(147,212,255,0.95)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="9" r="2.5"/>
        </g>
      </g>
    </g>
    <rect x="30" y="65" width="260" height="100" rx="14" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.07)"/>
    ${[
      { hex: '#ef4444', count: 2, y: 76 },
      { hex: '#60a5fa', count: 1, y: 105 },
      { hex: '#4ade80', count: 1, y: 134 }
    ]
      .map(
        (row) => `
      <g transform="translate(46, ${row.y}) scale(0.55)">${jarInner(row.hex)}</g>
      <g transform="translate(190, ${row.y + 5})">
        <rect x="0" y="0" width="20" height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)"/>
        <text x="10" y="14" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="14" font-weight="600" font-family="system-ui">−</text>
        <text x="38" y="15" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="14" font-family="Fraunces, serif" font-style="italic" font-weight="800">${row.count}</text>
        <rect x="56" y="0" width="20" height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)"/>
        <text x="66" y="14" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="14" font-weight="600" font-family="system-ui">+</text>
      </g>`
      )
      .join('')}
  </svg>`;
}

export function vPlace(): string {
  const palette = ['#ef4444', '#60a5fa', '#facc15', '#c084fc'];
  let svg = `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">`;
  palette.forEach((c, i) => {
    svg += `<g transform="translate(${56 + i * 50}, 8)">${jarInner(c)}</g>`;
  });
  for (let i = 0; i < 4; i++) {
    svg += `<g transform="translate(${56 + i * 50}, 105)">${slotInner()}</g>`;
  }
  svg += `<circle cx="${56 + 50 + 20}" cy="34" r="3" fill="rgba(147,212,255,0.7)" class="t-tap"/>`;
  svg += `<g class="t-fly" style="--from-x: ${56 + 50}px; --from-y: 8px; --to-x: ${56}px; --to-y: 105px;">${jarInner(palette[1])}</g>`;
  svg += `</svg>`;
  return svg;
}

export function vFeedback(): string {
  let svg = `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">`;
  const colors = ['#ef4444', '#60a5fa', '#4ade80'];
  colors.forEach((c, i) => {
    svg += `<g transform="translate(${70 + i * 65}, 30)">${jarInner(c)}</g>`;
  });
  colors.forEach((_, i) => {
    const cx = 70 + i * 65 + 20;
    const cy = 110;
    const colPhase = i * 0.4;
    const variants = [
      { delay: colPhase, content: `<circle r="11" fill="transparent" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>` },
      {
        delay: colPhase + 1.0,
        content: `<circle r="11" fill="rgba(110,231,168,0.22)" stroke="rgba(110,231,168,0.65)" stroke-width="1.2"/>
          <polyline points="-4 0 -1 3 4 -3" fill="none" stroke="#6ee7a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      },
      {
        delay: colPhase + 2.0,
        content: `<circle r="11" fill="rgba(255,138,138,0.22)" stroke="rgba(255,138,138,0.65)" stroke-width="1.2"/>
          <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ff8a8a" stroke-width="2" stroke-linecap="round"/>
          <line x1="4" y1="-4" x2="-4" y2="4" stroke="#ff8a8a" stroke-width="2" stroke-linecap="round"/>`
      }
    ];
    for (const v of variants) {
      svg += `<g transform="translate(${cx}, ${cy})">
        <g class="t-fb" style="animation-delay: ${v.delay.toFixed(2)}s;">${v.content}</g>
      </g>`;
    }
  });
  svg += `</svg>`;
  return svg;
}

export function vSolver(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${[0, 1, 2, 3]
        .map(
          (i) => `
        <linearGradient id="tg-grad${i}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="30%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="${i === 3 ? '#6ee7a8' : '#93d4ff'}"/>
        </linearGradient>`
        )
        .join('')}
    </defs>
    ${['120', '32', '8', '1']
      .map(
        (n, i) => `
      <text x="160" y="62" text-anchor="middle"
            font-family="Fraunces, serif" font-style="italic" font-weight="800"
            font-size="58" letter-spacing="-2" fill="url(#tg-grad${i})"
            class="t-fade-cycle"
            style="opacity: 0; animation-delay: ${i}s;">${n}</text>`
      )
      .join('')}
    <text x="160" y="86" text-anchor="middle" fill="rgba(255,255,255,0.4)"
          font-size="9" letter-spacing="3" font-family="DM Mono, monospace" font-weight="500">POSSIBILITIES</text>
    <line x1="40" y1="105" x2="280" y2="105" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    ${[0, 1, 2, 3, 4]
      .map((col) => {
        const x = 60 + col * 45;
        return [0, 1, 2]
          .map((row) => {
            const y = 118 + row * 18;
            const hue = ['#ef4444', '#60a5fa', '#4ade80', '#fb923c', '#c084fc'][col];
            const delay = (col * 0.5 + row * 0.3).toFixed(2);
            return `<g transform="translate(${x}, ${y}) scale(0.32)" class="t-fade" style="animation-delay: ${delay}s;">${jarInner(hue)}</g>`;
          })
          .join('');
      })
      .join('')}
  </svg>`;
}

export const SLUSH_SLIDES = [
  { title: 'slush solver', caption: 'a quick walkthrough · 5 steps', svg: vWelcome },
  { title: 'set your jars', caption: 'open settings · edit the inventory', svg: vInventory },
  { title: 'tap to place', caption: 'palette → fills the next empty slot', svg: vPlace },
  { title: 'mark each result', caption: 'tap below · ✓ correct · ✕ wrong', svg: vFeedback },
  { title: 'watch it narrow', caption: 'count drops · options fade · solved', svg: vSolver }
];
