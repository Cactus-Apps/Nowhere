import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "../locales/de.json";
import en from "../locales/en.json";
import es from "../locales/es.json";

/**
 * Resolves when bundled translations are available.
 * Gate the root UI on this so the first paint does not show raw translation keys.
 */
// eslint-disable-next-line import/no-named-as-default-member
export const i18nReady = i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

/** @returns {Promise<void>} Resolves when bundled strings are applied. */
export function ensureTranslationsLoaded() {
  return i18nReady;
}

const changeLanguage = (lng: string) => {
  // eslint-disable-next-line import/no-named-as-default-member
  return i18n.changeLanguage(lng);
};

export { changeLanguage };
export default i18n;
