import { describe, it, expect } from 'vitest';
import { offsetMinutes, dayOffsetFor, matchesOffsetQuery } from '../../src/lib/tools/tz/time';
import { mod, formatTime, formatTimeAmPm, formatOffset } from '../../src/lib/utils/format';

describe('offsetMinutes', () => {
  it('UTC is always 0', () => {
    expect(offsetMinutes('UTC')).toBe(0);
    expect(offsetMinutes('Etc/UTC')).toBe(0);
  });

  it('returns minute-resolution offsets for half-hour zones', () => {
    // India is UTC+5:30 (no DST).
    expect(offsetMinutes('Asia/Kolkata')).toBe(330);
  });

  it('handles negative offsets', () => {
    // Honolulu is UTC-10 year-round.
    expect(offsetMinutes('Pacific/Honolulu')).toBe(-600);
  });
});

describe('dayOffsetFor', () => {
  it('0 when within the same calendar day', () => {
    expect(dayOffsetFor(720, 0)).toBe(0); // noon UTC at UTC = same day
    expect(dayOffsetFor(120, -60)).toBe(0); // 02:00 UTC at -1h = 01:00 same day
  });

  it('+1 when offset pushes past midnight', () => {
    // 23:00 UTC + 2h = 25:00 → next day
    expect(dayOffsetFor(23 * 60, 120)).toBe(1);
  });

  it('-1 when offset pulls before midnight', () => {
    // 01:00 UTC - 2h = -01:00 → previous day
    expect(dayOffsetFor(60, -120)).toBe(-1);
  });

  it('exact midnight boundary', () => {
    expect(dayOffsetFor(0, 0)).toBe(0);
    expect(dayOffsetFor(1439, 1)).toBe(1); // crosses into next day by 1 minute
  });
});

describe('matchesOffsetQuery', () => {
  it('signed integer hours: "+9" matches +540 only', () => {
    expect(matchesOffsetQuery(540, '+9')).toBe(true);
    expect(matchesOffsetQuery(-540, '+9')).toBe(false);
  });

  it('signed integer hours: "-3" matches -180 only', () => {
    expect(matchesOffsetQuery(-180, '-3')).toBe(true);
    expect(matchesOffsetQuery(180, '-3')).toBe(false);
  });

  it('unsigned matches both polarities', () => {
    expect(matchesOffsetQuery(420, '7')).toBe(true);
    expect(matchesOffsetQuery(-420, '7')).toBe(true);
    expect(matchesOffsetQuery(0, '7')).toBe(false);
  });

  it('"5:30" matches both ±5:30', () => {
    expect(matchesOffsetQuery(330, '5:30')).toBe(true);
    expect(matchesOffsetQuery(-330, '5:30')).toBe(true);
    expect(matchesOffsetQuery(300, '5:30')).toBe(false);
  });

  it('"utc-3" parses the prefix and sign', () => {
    expect(matchesOffsetQuery(-180, 'utc-3')).toBe(true);
    expect(matchesOffsetQuery(180, 'utc-3')).toBe(false);
  });

  it('"utc+05:30" parses prefix + signed offset with minutes', () => {
    expect(matchesOffsetQuery(330, 'utc+05:30')).toBe(true);
    expect(matchesOffsetQuery(-330, 'utc+05:30')).toBe(false);
  });

  it('garbage input returns false', () => {
    expect(matchesOffsetQuery(0, 'hello')).toBe(false);
    expect(matchesOffsetQuery(0, '')).toBe(false);
    expect(matchesOffsetQuery(0, '++3')).toBe(false);
  });
});

describe('format helpers', () => {
  it('mod handles negatives', () => {
    expect(mod(-1, 1440)).toBe(1439);
    expect(mod(-1440, 1440)).toBe(0);
    expect(mod(2880, 1440)).toBe(0);
  });

  it('formatTime pads', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(60 + 5)).toBe('01:05');
    expect(formatTime(23 * 60 + 59)).toBe('23:59');
  });

  it('formatOffset signs + pads + drops zero minutes', () => {
    expect(formatOffset(0)).toBe('UTC+00');
    expect(formatOffset(540)).toBe('UTC+09');
    expect(formatOffset(330)).toBe('UTC+05:30');
    expect(formatOffset(-180)).toBe('UTC-03');
  });

  it('formatTimeAmPm handles midnight, noon, and the boundaries', () => {
    expect(formatTimeAmPm(0)).toBe('12:00 am');
    expect(formatTimeAmPm(60)).toBe('1:00 am');
    expect(formatTimeAmPm(11 * 60 + 59)).toBe('11:59 am');
    expect(formatTimeAmPm(12 * 60)).toBe('12:00 pm');
    expect(formatTimeAmPm(13 * 60)).toBe('1:00 pm');
    expect(formatTimeAmPm(23 * 60 + 5)).toBe('11:05 pm');
  });
});
