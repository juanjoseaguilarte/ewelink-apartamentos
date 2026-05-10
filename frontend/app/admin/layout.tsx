"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import Link from "next/link";
import UpdateBanner from "./UpdateBanner";

type Permisos = Record<string, boolean>;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [nombre, setNombre] = useState("");
  const [role, setRole] = useState("");
  const [permisos, setPermisos] = useState<Permisos>({});

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
    } else {
      setNombre(user.nombre);
      setRole(user.role);
      setPermisos(user.permisos);
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  const isAdmin = role === "admin";
  const can = (p: string) => isAdmin || !!permisos[p];

  function navLink(href: string, label: string) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        className={`text-sm font-medium transition-colors hover:text-blue-200 ${active ? "underline text-white" : "text-blue-100"}`}
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <UpdateBanner />
      <nav className="bg-blue-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            {can("reservas_ver") && navLink("/admin", "Reservas")}
            {can("reservas_crear") && navLink("/admin/nueva", "Nueva reserva")}
            {can("limpieza_ver") && navLink("/admin/limpieza", "Limpieza")}
            {isAdmin && navLink("/admin/propiedades", "Propiedades")}
            {isAdmin && navLink("/admin/dashboard", "Usuarios")}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-200 hidden sm:block">{nombre}</span>
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
