"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();

  function logout() {
    removeToken();
    router.push("/login");
  }

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/admin/nueva" className="hover:text-blue-200 transition-colors">
            Nueva Reserva
          </Link>
          <Link href="/admin" className="hover:text-blue-200 transition-colors">
            Ver Reservas
          </Link>
        </div>
        <button
          onClick={logout}
          className="text-sm bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors font-medium"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
