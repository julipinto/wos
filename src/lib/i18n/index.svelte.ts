import en from './messages/en.json';
import pt from './messages/pt.json';
import es from './messages/es.json';
import ru from './messages/ru.json';
import ar from './messages/ar.json';
import { readString, writeString } from '$lib/utils/storage';

export type Locale = 'en' | 'pt' | 'es' | 'ru' | 'ar';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'pt', 'es', 'ru', 'ar'];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
  ru: 'Русский',
  ar: 'العربية'
};

/** Locales rendered right-to-left. The 0-24h slider stays LTR — see RTL notes. */
export const RTL_LOCALES: Locale[] = ['ar'];

type Messages = typeof en;
const dict: Record<Locale, Messages> = { en, pt, es, ru, ar };

const STORAGE_KEY = 'wos-locale';

function applyDocumentAttrs(l: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = l;
  document.documentElement.dir = RTL_LOCALES.includes(l) ? 'rtl' : 'ltr';
}

/**
 * Shared i18n state. Implemented as a class with $state/$derived fields —
 * this is the official Svelte 5 pattern for sharing runes across modules,
 * and unlike a plain-object-with-getters wrapper it routes reads through
 * the rune system directly so dependents re-render on locale changes.
 */
class I18n {
  locale = $state<Locale>('en');
  isRtl = $derived(RTL_LOCALES.includes(this.locale));
  m = $derived(dict[this.locale]);

  setLocale(l: Locale): void {
    if (!SUPPORTED_LOCALES.includes(l)) return;
    this.locale = l;
    writeString(STORAGE_KEY, l);
    applyDocumentAttrs(l);
  }

  /** Read stored locale, or sniff from navigator.language, or fall back to 'en'. */
  initFromBrowser(): void {
    if (typeof window === 'undefined') return;
    const stored = readString(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      this.locale = stored as Locale;
      applyDocumentAttrs(this.locale);
      return;
    }
    const guess = navigator.language?.toLowerCase().slice(0, 2) as Locale;
    if (SUPPORTED_LOCALES.includes(guess)) {
      this.locale = guess;
    }
    applyDocumentAttrs(this.locale);
  }
}

export const i18n = new I18n();

/** Interpolate {placeholder} tokens. Lightweight; no plural rules yet. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** BCP-47 locale per UI language, for Intl number grouping. */
const NUMBER_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  pt: 'pt-BR',
  es: 'es-ES',
  ru: 'ru-RU',
  ar: 'ar'
};

/**
 * Group an integer with the current language's thousands separator
 * (en → 1,000 · pt → 1.000 · ru → 1 000). Reads `i18n.locale`, so callers in a
 * reactive context re-run when the language changes. For readable inputs.
 */
export function groupNumber(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '';
  return new Intl.NumberFormat(NUMBER_LOCALE[i18n.locale]).format(Math.round(n));
}
