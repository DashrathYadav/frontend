import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';

// Language detection configuration
const languageDetectorOptions = {
  // Order of language detection methods
  order: ['localStorage', 'navigator'],
  // Keys to lookup language from
  lookupLocalStorage: 'i18nextLng',
  // Cache user language
  caches: ['localStorage'],
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      hi: {
        translation: hiTranslations,
      },
    },
    fallbackLng: 'en',
    debug: false,
    detection: languageDetectorOptions,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
