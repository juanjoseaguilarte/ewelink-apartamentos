"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
    } else {
      setNombre(user.nombre);
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className={`text-sm font-medium hover:text-blue-200 transition-colors ${pathname === "/admin" ? "underline" : ""}`}
            >
              Reservas
            </Link>
            <Link
              href="/admin/nueva"
              className={`text-sm font-medium hover:text-blue-200 transition-colors ${pathname === "/admin/nueva" ? "underline" : ""}`}
            >
              Nueva reserva
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-200">{nombre}</span>
            <button
              onClick={logout}
              className="text-sm bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
