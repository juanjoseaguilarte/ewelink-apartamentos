import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const SUPPORTED = ["es", "en", "fr", "de", "pt"];

async function loadMessages(lng: string) {
  try {
    const res = await fetch(`/locales/${lng}/common.json`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return {};
  }
}

let initialized = false;

export async function initI18n() {
  if (initialized) return;
  initialized = true;

  const detector = new LanguageDetector();
  const detected = detector.detect() as string | string[] | undefined;
  const raw = Array.isArray(detected) ? detected[0] : detected ?? "es";
  const lang = raw?.split("-")[0] ?? "es";
  const lng = SUPPORTED.includes(lang) ? lang : "es";

  const messages = await loadMessages(lng);
  const fallback = lng !== "es" ? await loadMessages("es") : {};

  await i18n
    .use(initReactI18next)
    .init({
      lng,
      fallbackLng: "es",
      resources: {
        [lng]: { common: messages },
        ...(lng !== "es" ? { es: { common: fallback } } : {}),
      },
      ns: ["common"],
      defaultNS: "common",
      interpolation: { escapeValue: false },
    });
}

export async function changeLanguage(lng: string) {
  if (!SUPPORTED.includes(lng)) return;
  const messages = await loadMessages(lng);
  if (!i18n.hasResourceBundle(lng, "common")) {
    i18n.addResourceBundle(lng, "common", messages);
  }
  await i18n.changeLanguage(lng);
  localStorage.setItem("i18nextLng", lng);
}

export { SUPPORTED };
export default i18n;
