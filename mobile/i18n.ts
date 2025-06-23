import { en, fr, sw } from "@/locales";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const storedLanguage = await AsyncStorage.getItem("userLanguage");
      if (storedLanguage) {
        callback(storedLanguage);
        return;
      }

      const locales = Localization.getLocales();
      const deviceLanguage = locales[0]?.languageCode || "en";
      callback(deviceLanguage);
    } catch (error) {
      console.error("Error detecting language:", error);
      callback("en");
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem("userLanguage", lng);
    } catch (error) {
      console.error("Error saving language preference:", error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      sw: { translation: sw },
      // Add when ready:
      // ar: { translation: ar }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
