"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, hasPerm } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default function MantenimientoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    if (!hasPerm("mantenimiento_ver")) router.replace("/admin");
  }, [router]);

  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
