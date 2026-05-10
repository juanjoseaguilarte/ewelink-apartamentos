"use client";

import { useTranslation } from "react-i18next";
import { changeLanguage, SUPPORTED } from "@/lib/i18n";

const FLAGS: Record<string, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
  de: "🇩🇪",
  pt: "🇵🇹",
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.split("-")[0] ?? "es";

  return (
    <div className="flex items-center gap-1">
      {SUPPORTED.map((lng) => (
        <button
          key={lng}
          onClick={() => changeLanguage(lng)}
          title={lng.toUpperCase()}
          className={`text-base leading-none transition-opacity ${
            current === lng ? "opacity-100" : "opacity-40 hover:opacity-70"
          }`}
        >
          {FLAGS[lng]}
        </button>
      ))}
    </div>
  );
}
