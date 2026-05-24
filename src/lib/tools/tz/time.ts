/** UTC and timezone offset helpers. Uses Intl.DateTimeFormat for IANA lookup
 * so DST transitions are handled automatically. */

export function nowUtcMinutes(): number {
  const d = new Date();
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Current offset (in minutes) of an IANA timezone from UTC.
 * Positive = ahead of UTC. `atDate` allows asking about a historical or
 * future instant (useful in tests).
 */
export function offsetMinutes(iana: string, atDate: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: iana,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(atDate).map((p) => [p.type, p.value]));
  // Some locales emit hour "24" for midnight; normalize.
  const h = +parts.hour === 24 ? 0 : +parts.hour;
  const asUtcMs = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    h,
    +parts.minute,
    +parts.second
  );
  // `|| 0` normalizes -0 (which Math.round can produce) to +0.
  return Math.round((asUtcMs - atDate.getTime()) / 60000) || 0;
}

/** Days off UTC's calendar day at this (baseUtcMin + offsetMin). Typically -1, 0, or +1. */
export function dayOffsetFor(baseUtcMin: number, offsetMin: number): number {
  return Math.floor((baseUtcMin + offsetMin) / 1440);
}

/**
 * Match a free-form offset query against an offset (in minutes).
 * Accepts: "-7", "+9", "5:30", "utc-3", "utc+05:30".
 * Unsigned input matches both polarities ("7" → UTC+7 AND UTC-7).
 */
export function matchesOffsetQuery(offsetMin: number, rawQuery: string): boolean {
  const q = rawQuery
    .toLowerCase()
    .trim()
    .replace(/^utc\s*/, '');
  const m = q.match(/^([+-]?)\s*(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return false;
  const sign = m[1] === '-' ? -1 : 1;
  const hasSign = m[1] === '+' || m[1] === '-';
  const total = (parseInt(m[2], 10) * 60 + parseInt(m[3] ?? '0', 10)) * sign;
  if (hasSign) return offsetMin === total;
  return offsetMin === total || offsetMin === -total;
}
