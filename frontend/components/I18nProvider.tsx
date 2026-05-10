"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { changeLanguage, SUPPORTED } from "@/lib/i18n";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("i18nextLng");
    const browser = navigator.language?.split("-")[0] ?? "es";
    const lng = saved ?? (SUPPORTED.includes(browser) ? browser : "es");
    if (lng !== i18n.language) changeLanguage(lng);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
