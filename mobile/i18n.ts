import { en, fr } from "@/locales";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

const locales = Localization.getLocales();

// Configure i18n
i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: locales[0].languageCode ?? "en", // use device default language, fallback to english
  // lng: Localization.locale.split('-')[0], // Detect device language
  fallbackLng: "en", // Fallback language
  interpolation: {
    escapeValue: false, // React already escapes strings
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
