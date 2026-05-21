"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, saveSession, authFetch } from "@/lib/auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "");

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Change-password flow
  const [mustChange, setMustChange] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");

  useEffect(() => {
    if (getToken()) {
      router.replace("/admin");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) return null;

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error ?? "Error al iniciar sesión");
      } else if (data.must_change_password) {
        setPendingToken(data.token);
        saveSession(data);
        setMustChange(true);
        setCurrentPwd(password);
      } else {
        saveSession(data);
        router.replace("/admin");
      }
    } catch {
      setMsg("Error de conexión");
    }
    setLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    if (newPwd !== newPwd2) {
      setMsg("Las contraseñas no coinciden");
      return;
    }
    if (newPwd.length < 6) {
      setMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/change-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${pendingToken}` },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        router.replace("/admin");
      } else {
        setMsg(data.error ?? "Error al cambiar la contraseña");
      }
    } catch {
      setMsg("Error de conexión");
    }
    setLoading(false);
  }

  if (mustChange) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Cambia tu contraseña</h1>
            <p className="text-sm text-gray-500 mt-1">Debes establecer una nueva contraseña antes de continuar.</p>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repite la contraseña</label>
              <input
                type="password"
                value={newPwd2}
                onChange={(e) => setNewPwd2(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {msg && <p className="text-sm text-red-600 text-center">{msg}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">Inicia sesión para continuar</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {msg && <p className="text-sm text-red-600 text-center">{msg}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
