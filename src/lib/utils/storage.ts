/**
 * localStorage wrapper. Every operation is try/catch'd because:
 *   - private/incognito mode can throw on first write
 *   - quota errors can throw on writes
 *   - the storage API is undefined in non-browser contexts (SSR)
 *
 * Reads return `null` on miss or error; writes return whether they succeeded.
 */

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function readJson<T>(key: string): T | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson<T>(key: string, value: T): boolean {
  if (!isBrowser) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readString(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): boolean {
  if (!isBrowser) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
