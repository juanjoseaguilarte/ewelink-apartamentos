"use client";

import { useEffect, useState } from "react";

const CLIENT_BUILD_TS = process.env.NEXT_PUBLIC_BUILD_TS ?? "0";
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export default function UpdateBanner() {
  const [newVersion, setNewVersion] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) return;
        const { buildTs } = await res.json();
        if (buildTs && buildTs !== CLIENT_BUILD_TS) {
          setNewVersion(true);
        }
      } catch { /* ignore network errors */ }
    }

    const timer = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  if (!newVersion) return null;

  return (
    <div className="bg-amber-400 text-amber-900 text-sm font-medium px-4 py-2 flex items-center justify-between">
      <span>🔄 Nueva versión disponible.</span>
      <button
        onClick={() => window.location.reload()}
        className="ml-4 underline hover:no-underline font-semibold"
      >
        Actualizar ahora
      </button>
    </div>
  );
}
