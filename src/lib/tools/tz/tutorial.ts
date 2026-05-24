function staticPin(color: string, x: number, y: number): string {
  return `
    <g transform="translate(${x}, ${y})">
      <line x1="0" y1="2" x2="0" y2="22" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <circle cx="0" cy="0" r="4.5" fill="${color}" filter="drop-shadow(0 0 6px ${color}aa)"/>
    </g>`;
}

function bobPin(color: string, x: number, y: number, delay: number): string {
  return `
    <g transform="translate(${x}, ${y})">
      <g class="t-bob" style="animation-delay: ${delay}s;">
        <line x1="0" y1="2" x2="0" y2="22" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        <circle cx="0" cy="0" r="4.5" fill="${color}" filter="drop-shadow(0 0 6px ${color}aa)"/>
      </g>
    </g>`;
}

export function vWelcomeTz(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="anchor-grad-w" x1="0" y1="0" x2="0" y2="1">
        <stop offset="25%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#93d4ff"/>
      </linearGradient>
    </defs>
    <text x="160" y="58" text-anchor="middle"
          font-family="'Fraunces', serif" font-style="italic" font-weight="800"
          font-size="44" letter-spacing="-1" fill="url(#anchor-grad-w)">14:32</text>
    <text x="160" y="78" text-anchor="middle"
          font-family="'DM Mono', monospace" font-size="9" letter-spacing="3"
          fill="rgba(147,212,255,0.7)">UTC</text>
    <rect x="40" y="118" width="240" height="3" rx="1.5" fill="rgba(255,255,255,0.1)"/>
    ${bobPin('#93d4ff', 72, 128, 0)}
    ${bobPin('#fb923c', 128, 128, 0.3)}
    ${bobPin('#4ade80', 188, 128, 0.6)}
    ${bobPin('#c084fc', 248, 128, 0.9)}
  </svg>`;
}

export function vDragTz(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="anchor-grad-d" x1="0" y1="0" x2="0" y2="1">
        <stop offset="25%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#93d4ff"/>
      </linearGradient>
    </defs>
    <g class="t-sync">
      <text x="160" y="60" text-anchor="middle"
            font-family="'Fraunces', serif" font-style="italic" font-weight="800"
            font-size="34" letter-spacing="-0.5" fill="url(#anchor-grad-d)">14:32</text>
      ${staticPin('#93d4ff', 100, 125)}
      ${staticPin('#fb923c', 160, 125)}
      ${staticPin('#4ade80', 220, 125)}
      <g transform="translate(160, 138)" opacity="0.7">
        <path d="M -18 0 L -12 -3 M -18 0 L -12 3" stroke="rgba(255,255,255,0.85)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M 18 0 L 12 -3 M 18 0 L 12 3" stroke="rgba(255,255,255,0.85)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    </g>
    <rect x="40" y="115" width="240" height="3" rx="1.5" fill="rgba(255,255,255,0.1)"/>
  </svg>`;
}

export function vAddTz(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="14" width="264" height="150" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)"/>
    <text x="44" y="36" font-family="'Fraunces', serif" font-style="italic" font-weight="700"
          font-size="14" fill="rgba(255,255,255,0.92)">add timezone</text>
    <rect x="44" y="48" width="232" height="24" rx="6" fill="rgba(0,0,0,0.3)" stroke="rgba(147,212,255,0.3)"/>
    <text x="54" y="64" font-family="'DM Mono', monospace" font-size="11" fill="rgba(255,255,255,0.85)" letter-spacing="1">+9</text>
    <rect x="44" y="82" width="232" height="32" rx="6" fill="rgba(147,212,255,0.10)" stroke="rgba(147,212,255,0.5)" stroke-width="1.2"/>
    <text x="56" y="97" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.95)" letter-spacing="1">JST · Tokyo</text>
    <text x="56" y="108" font-family="'DM Mono', monospace" font-size="8" fill="rgba(255,255,255,0.45)" letter-spacing="0.5">Asia/Tokyo</text>
    <text x="264" y="102" text-anchor="end" font-family="'DM Mono', monospace" font-size="9" fill="rgba(147,212,255,0.85)" letter-spacing="0.5">UTC+09:00</text>
    <rect x="44" y="122" width="232" height="32" rx="6" fill="rgba(255,255,255,0.03)"/>
    <text x="56" y="137" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.85)" letter-spacing="1">KST · Seoul</text>
    <text x="56" y="148" font-family="'DM Mono', monospace" font-size="8" fill="rgba(255,255,255,0.4)" letter-spacing="0.5">Asia/Seoul</text>
    <text x="264" y="142" text-anchor="end" font-family="'DM Mono', monospace" font-size="9" fill="rgba(255,255,255,0.4)" letter-spacing="0.5">UTC+09:00</text>
  </svg>`;
}

export function vLiveManualTz(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <g class="t-show-a">
      <rect x="60" y="40" width="200" height="48" rx="24" fill="rgba(110,231,168,0.10)" stroke="rgba(110,231,168,0.4)"/>
      <circle cx="92" cy="64" r="4" fill="#6ee7a8" class="t-pulse-fast"/>
      <text x="115" y="69" font-family="'DM Mono', monospace" font-size="13" letter-spacing="3" fill="#6ee7a8">LIVE</text>
      <text x="235" y="69" text-anchor="end" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.5)" letter-spacing="1">14:32 →</text>
    </g>
    <g class="t-show-b">
      <rect x="60" y="40" width="200" height="48" rx="24" fill="rgba(147,212,255,0.10)" stroke="rgba(147,212,255,0.4)"/>
      <text x="92" y="69" font-family="'DM Mono', monospace" font-size="13" letter-spacing="3" fill="#93d4ff">MANUAL</text>
      <text x="235" y="69" text-anchor="end" font-family="'DM Mono', monospace" font-size="10" fill="rgba(255,255,255,0.5)" letter-spacing="1">14:32 ⏸</text>
    </g>
    <text x="160" y="120" text-anchor="middle"
          font-family="'Fraunces', serif" font-style="italic" font-weight="600"
          font-size="14" fill="rgba(255,255,255,0.65)">reset to now</text>
    <g transform="translate(160, 138)">
      <circle r="14" fill="rgba(147,212,255,0.06)" stroke="rgba(147,212,255,0.35)" stroke-width="1.2"/>
      <path d="M-5 -3 a5 5 0 1 1 -1 5 L-7 4 M-7 4 L-4 4 M-7 4 L-7 1"
            stroke="rgba(147,212,255,0.9)" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

export function vTagsTz(): string {
  return `<svg viewBox="0 0 320 175" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="30" width="264" height="116" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>
    <circle cx="48" cy="56" r="4.5" fill="#fb923c"/>
    <line x1="48" y1="60" x2="48" y2="78" stroke="#fb923c" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <text x="62" y="54" font-family="'DM Mono', monospace" font-size="11" fill="rgba(255,255,255,0.9)" letter-spacing="1">BRT · UTC-03:00</text>
    <text x="62" y="68" font-family="'DM Mono', monospace" font-size="9" fill="rgba(255,255,255,0.4)" letter-spacing="0.5">São Paulo, Brazil</text>
    <text x="278" y="65" text-anchor="end"
          font-family="'Fraunces', serif" font-style="italic" font-weight="700"
          font-size="22" fill="rgba(255,255,255,0.92)">11:32</text>
    <g class="t-chip-fade" style="animation-delay: 0.3s;">
      <rect x="62" y="96" width="56" height="20" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)"/>
      <text x="90" y="109" text-anchor="middle" font-family="'DM Mono', monospace" font-size="9" fill="rgba(255,255,255,0.75)" letter-spacing="0.5">carlos</text>
    </g>
    <g class="t-chip-fade" style="animation-delay: 1.1s;">
      <rect x="124" y="96" width="52" height="20" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)"/>
      <text x="150" y="109" text-anchor="middle" font-family="'DM Mono', monospace" font-size="9" fill="rgba(255,255,255,0.75)" letter-spacing="0.5">maria</text>
    </g>
    <g class="t-chip-fade" style="animation-delay: 1.9s;">
      <rect x="182" y="96" width="44" height="20" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)"/>
      <text x="204" y="109" text-anchor="middle" font-family="'DM Mono', monospace" font-size="9" fill="rgba(255,255,255,0.75)" letter-spacing="0.5">vini</text>
    </g>
    <circle cx="240" cy="106" r="10" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2 2"/>
    <path d="M240 101 V111 M235 106 H245" stroke="rgba(255,255,255,0.55)" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
}

export const TZ_SLIDES = [
  { title: 'time tool', caption: 'convert utc · both ways · all timezones', svg: vWelcomeTz },
  { title: 'drag any pin', caption: 'they all move in sync', svg: vDragTz },
  { title: 'add timezones', caption: 'search by city · or offset · ±9', svg: vAddTz },
  { title: 'live until you drag', caption: 'reset returns to now', svg: vLiveManualTz },
  { title: 'tag people', caption: 'drop names on each timezone', svg: vTagsTz }
];
