"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { removeToken, getUserInfo, isAdmin, hasPerm } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUserInfo();

  function logout() {
    removeToken();
    router.push("/login");
  }

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors hover:text-white ${
      pathname.startsWith(href) ? "text-white" : "text-blue-200"
    }`;

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-5 items-center">
          <span className="font-bold text-white text-base">Rentalsur</span>
          {hasPerm("reservas_ver") && (
            <Link href="/admin" className={linkClass("/admin")}>Reservas</Link>
          )}
          {hasPerm("mensajes_ver") && (
            <Link href="/mensajes" className={linkClass("/mensajes")}>Mensajes</Link>
          )}
          {hasPerm("mantenimiento_ver") && (
            <Link href="/mantenimiento" className={linkClass("/mantenimiento")}>Mantenimiento</Link>
          )}
          {hasPerm("limpieza_ver") && (
            <Link href="/limpieza" className={linkClass("/limpieza")}>Limpieza</Link>
          )}
          {isAdmin() && (
            <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-xs hidden sm:block">
            {user?.nombre} · <span className="capitalize">{user?.role}</span>
          </span>
          <button
            onClick={logout}
            className="text-sm bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors font-medium"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
