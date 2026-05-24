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

// Keep both `locale` and `m` in $state so templates that read `i18n.m.x.y`
// re-render when locale changes. A getter that returns `dict[state.locale]`
// is technically reactive, but reads through a non-$state plain JSON
// reference don't always propagate cleanly — assigning `state.m` on swap
// makes the dependency unambiguous.
const state = $state<{ locale: Locale; m: Messages }>({
  locale: 'en',
  m: dict.en
});

function applyDocumentAttrs(l: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = l;
  document.documentElement.dir = RTL_LOCALES.includes(l) ? 'rtl' : 'ltr';
}

function applyLocale(l: Locale): void {
  state.locale = l;
  state.m = dict[l];
  applyDocumentAttrs(l);
}

export const i18n = {
  get locale(): Locale {
    return state.locale;
  },
  get isRtl(): boolean {
    return RTL_LOCALES.includes(state.locale);
  },
  get m(): Messages {
    return state.m;
  },
  setLocale(l: Locale): void {
    if (!SUPPORTED_LOCALES.includes(l)) return;
    applyLocale(l);
    writeString(STORAGE_KEY, l);
  },
  /** Read stored locale, or sniff from navigator.language, or fall back to 'en'. */
  initFromBrowser(): void {
    if (typeof window === 'undefined') return;
    const stored = readString(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      applyLocale(stored as Locale);
      return;
    }
    const guess = navigator.language?.toLowerCase().slice(0, 2) as Locale;
    if (SUPPORTED_LOCALES.includes(guess)) {
      applyLocale(guess);
    } else {
      applyDocumentAttrs(state.locale);
    }
  }
};

/** Interpolate {placeholder} tokens. Lightweight; no plural rules yet. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
