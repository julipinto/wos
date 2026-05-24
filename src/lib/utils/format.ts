/** Numeric / time formatting helpers shared across tools. */

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** True modulo (handles negative `a`). */
export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n;
}

/** "HH:MM" from minutes-of-day. */
export function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

/**
 * "H:MM am/pm" from minutes-of-day. 12-hour secondary display alongside the
 * 24h primary — for readers who can't parse 24h at a glance. No leading zero
 * on the hour (1:05 pm reads cleaner than 01:05 pm at small sizes).
 */
export function formatTimeAmPm(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const period = h24 < 12 ? 'am' : 'pm';
  // 0 → 12am (midnight), 12 → 12pm (noon), 13..23 → 1..11pm
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad2(m)} ${period}`;
}

/** "UTC+09:00", "UTC-03", "UTC+05:30" from minutes-of-offset. */
export function formatOffset(min: number): string {
  const sign = min >= 0 ? '+' : '-';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${pad2(h)}${m ? ':' + pad2(m) : ''}`;
}

/**
 * Darken/lighten a hex color by a percentage (-100..+100).
 * Pure pixel math — no library. Same algorithm as the legacy `shade()`.
 */
export function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0x00ff) + amt;
  let b = (num & 0x0000ff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
