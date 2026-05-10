import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "../public/locales/es/common.json";
import en from "../public/locales/en/common.json";
import fr from "../public/locales/fr/common.json";
import de from "../public/locales/de/common.json";
import pt from "../public/locales/pt/common.json";

export const SUPPORTED = ["es", "en", "fr", "de", "pt"];

// Synchronous init with all translations bundled — safe for SSR and static generation.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "es",
    fallbackLng: "es",
    resources: {
      es: { common: es },
      en: { common: en },
      fr: { common: fr },
      de: { common: de },
      pt: { common: pt },
    },
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function changeLanguage(lng: string) {
  if (!SUPPORTED.includes(lng)) return;
  i18n.changeLanguage(lng);
  if (typeof window !== "undefined") {
    localStorage.setItem("i18nextLng", lng);
  }
}

export default i18n;
