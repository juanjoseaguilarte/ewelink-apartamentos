"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSystemUsers, createSystemUser, updateSystemUser, deleteSystemUser } from "@/lib/api";
import { getToken, isAdmin } from "@/lib/auth";
import { SystemUser, Role, Permisos } from "@/lib/types";

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: "admin", label: "Admin", color: "bg-red-100 text-red-700" },
  { value: "encargado", label: "Encargado", color: "bg-blue-100 text-blue-700" },
  { value: "mensajes", label: "Mensajes", color: "bg-purple-100 text-purple-700" },
  { value: "mantenimiento", label: "Mantenimiento", color: "bg-orange-100 text-orange-700" },
  { value: "limpiadora", label: "Limpiadora", color: "bg-green-100 text-green-700" },
];

const PERMS: { key: keyof Permisos; label: string; grupo: string }[] = [
  { key: "reservas_ver", label: "Ver reservas", grupo: "Reservas" },
  { key: "reservas_crear", label: "Crear reservas", grupo: "Reservas" },
  { key: "reservas_editar", label: "Editar reservas", grupo: "Reservas" },
  { key: "reservas_eliminar", label: "Eliminar reservas", grupo: "Reservas" },
  { key: "mensajes_ver", label: "Ver mensajes", grupo: "Mensajes" },
  { key: "mensajes_enviar", label: "Enviar mensajes", grupo: "Mensajes" },
  { key: "mantenimiento_ver", label: "Ver incidencias", grupo: "Mantenimiento" },
  { key: "mantenimiento_gestionar", label: "Gestionar incidencias", grupo: "Mantenimiento" },
  { key: "limpieza_ver", label: "Ver tareas", grupo: "Limpieza" },
  { key: "limpieza_gestionar", label: "Gestionar tareas", grupo: "Limpieza" },
];

const emptyPermisos = (): Permisos =>
  Object.fromEntries(PERMS.map((p) => [p.key, false])) as unknown as Permisos;

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isAdmin()) { router.replace("/admin"); return; }
    loadUsers();
  }, [router]);

  async function loadUsers() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await getSystemUsers(token);
      const data = await res.json();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  async function savePermisos(user: SystemUser) {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await updateSystemUser(user.id, { permisos: user.permisos }, token);
      if (res.ok) {
        setMsg("Permisos guardados");
        setTimeout(() => setMsg(""), 2000);
        loadUsers();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`¿Eliminar al usuario "${username}"?`)) return;
    const token = getToken();
    if (!token) return;
    const res = await deleteSystemUser(id, token);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
    }
  }

  function togglePerm(perm: keyof Permisos) {
    if (!selectedUser) return;
    setSelectedUser({
      ...selectedUser,
      permisos: { ...selectedUser.permisos, [perm]: !selectedUser.permisos[perm] },
    });
  }

  const roleInfo = (role: Role) => ROLES.find((r) => r.value === role);

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard de usuarios</h1>
        <button
          onClick={() => { setShowCreate(true); setSelectedUser(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de usuarios */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700 text-sm">Usuarios del sistema</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {users.map((u) => {
              const ri = roleInfo(u.role);
              return (
                <li
                  key={u.id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === u.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => { setSelectedUser({ ...u }); setShowCreate(false); }}
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{u.nombre}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ri?.color}`}>
                      {ri?.label}
                    </span>
                    {u.role !== "admin" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(u.id, u.username); }}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Panel de permisos o crear usuario */}
        {showCreate ? (
          <CreateUserPanel
            onCreated={() => { setShowCreate(false); loadUsers(); }}
            onCancel={() => setShowCreate(false)}
          />
        ) : selectedUser ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 text-sm">
                Permisos · {selectedUser.nombre}
              </h2>
              {selectedUser.role === "admin" && (
                <span className="text-xs text-gray-400">El admin tiene todos los permisos</span>
              )}
            </div>
            {selectedUser.role === "admin" ? (
              <div className="p-6 text-gray-400 text-sm">
                Los administradores tienen acceso total al sistema.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {["Reservas", "Mensajes", "Mantenimiento", "Limpieza"].map((grupo) => (
                  <div key={grupo}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{grupo}</p>
                    <div className="space-y-2">
                      {PERMS.filter((p) => p.grupo === grupo).map((p) => (
                        <label key={p.key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!selectedUser.permisos[p.key]}
                            onChange={() => togglePerm(p.key)}
                            className="w-4 h-4 rounded accent-blue-600"
                          />
                          <span className="text-sm text-gray-700">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {msg && <p className="text-green-600 text-sm">{msg}</p>}

                <button
                  onClick={() => savePermisos(selectedUser)}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium mt-2"
                >
                  {saving ? "Guardando..." : "Guardar permisos"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 text-sm min-h-48">
            Selecciona un usuario para editar sus permisos
          </div>
        )}
      </div>
    </div>
  );
}

function CreateUserPanel({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ username: "", nombre: "", password: "", role: "encargado" as Role });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await createSystemUser(form, token);
      const data = await res.json();
      if (res.ok) onCreated();
      else setError(data.error ?? "Error al crear el usuario");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="font-semibold text-gray-700 text-sm">Nuevo usuario</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          <input
            type="text"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Usuario</label>
          <input
            type="text"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROLES.filter((r) => r.value !== "admin").map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? "Creando..." : "Crear usuario"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
