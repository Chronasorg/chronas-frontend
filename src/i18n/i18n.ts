/**
 * i18n Configuration
 *
 * Sets up react-i18next with 17 supported languages.
 * English is the default and fallback language.
 * Other languages load on demand.
 *
 * Requirements: US-9.1, US-9.2
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ru from './locales/ru.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import sv from './locales/sv.json';
import el from './locales/el.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import vi from './locales/vi.json';
import ca from './locales/ca.json';

/**
 * All supported language codes.
 * Matches legacy: ar, ca, de, en, es, fr, el, hi, it, ja, nl, pl, pt, ru, sv, tr, zh, vi
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'sv', name: 'Svenska' },
  { code: 'ru', name: 'Русский' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'ca', name: 'Català' },
] as const;

const SUPPORTED_CODES = new Set<string>(SUPPORTED_LANGUAGES.map((l) => l.code));

/**
 * Detect locale from a language subdomain (e.g. de.chronas.org → 'de').
 * Returns the locale code if matched, otherwise undefined.
 */
function getSubdomainLocale(): string | undefined {
  try {
    const host = window.location.hostname;
    const match = /^([a-z]{2})\.chronas\.org$/i.exec(host);
    const code = match?.[1];
    if (code && SUPPORTED_CODES.has(code)) {
      return code;
    }
  } catch {
    // SSR or test environment — ignore
  }
  return undefined;
}

/**
 * Read the persisted locale from localStorage so i18next starts
 * with the correct language before React renders.
 */
function getPersistedLocale(): string {
  try {
    const raw = localStorage.getItem('chs_ui_preferences');
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { locale?: string } };
      const locale = parsed.state?.locale;
      if (typeof locale === 'string' && locale.length > 0) {
        return locale;
      }
    }
  } catch {
    // Ignore parse errors — fall back to 'en'
  }
  return 'en';
}

/**
 * Determine the initial locale. Subdomain takes precedence over localStorage.
 */
function getInitialLocale(): string {
  return getSubdomainLocale() ?? getPersistedLocale();
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      ru: { translation: ru },
      it: { translation: it },
      pt: { translation: pt },
      nl: { translation: nl },
      pl: { translation: pl },
      sv: { translation: sv },
      el: { translation: el },
      tr: { translation: tr },
      ar: { translation: ar },
      hi: { translation: hi },
      ja: { translation: ja },
      zh: { translation: zh },
      vi: { translation: vi },
      ca: { translation: ca },
    },
    lng: getInitialLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export { getSubdomainLocale };
export default i18n;
