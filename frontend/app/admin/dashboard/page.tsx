"use client";

import { useEffect, useState } from "react";
import { authFetch, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Permisos = Record<string, boolean>;

type SystemUser = {
  id: string;
  username: string;
  nombre: string;
  role: string;
  permisos: Permisos;
};

const ROLES = ["encargado", "mensajes", "mantenimiento", "limpiadora", "admin"] as const;

const PERM_LABELS: Record<string, string> = {
  reservas_ver: "Ver reservas",
  reservas_crear: "Crear reservas",
  reservas_editar: "Editar reservas",
  reservas_eliminar: "Eliminar reservas",
  mensajes_ver: "Ver mensajes",
  mensajes_enviar: "Enviar mensajes",
  mantenimiento_ver: "Ver mantenimiento",
  mantenimiento_gestionar: "Gestionar mantenimiento",
  limpieza_ver: "Ver limpieza",
  limpieza_gestionar: "Gestionar limpieza",
};

const PERM_KEYS = Object.keys(PERM_LABELS);

function PermToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={onChange}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ nombre: string; role: string; permisos: Permisos } | null>(null);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", nombre: "", role: "encargado" });
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  const me = getUser();

  useEffect(() => {
    if (me?.role !== "admin") { router.replace("/admin"); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await authFetch("/api/system/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  function startEdit(u: SystemUser) {
    setEditing(u.id);
    setEditData({ nombre: u.nombre, role: u.role, permisos: { ...u.permisos } });
    setMsg("");
  }

  function togglePerm(key: string) {
    if (!editData) return;
    setEditData((d) => d ? { ...d, permisos: { ...d.permisos, [key]: !d.permisos[key] } } : d);
  }

  async function saveEdit(id: string) {
    if (!editData) return;
    const res = await authFetch(`/api/system/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(editData),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...data } : u));
      setEditing(null);
      flash("Guardado", true);
    } else {
      flash(data.error ?? "Error", false);
    }
  }

  async function deleteUser(id: string, nombre: string) {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    const res = await authFetch(`/api/system/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      flash("Usuario eliminado", true);
    } else {
      const d = await res.json();
      flash(d.error ?? "Error", false);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await authFetch("/api/system/users", {
      method: "POST",
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => [...prev, data]);
      setCreating(false);
      setNewUser({ username: "", password: "", nombre: "", role: "encargado" });
      flash("Usuario creado. Deberá cambiar su contraseña en el primer login.", true);
    } else {
      flash(data.error ?? "Error", false);
    }
  }

  function flash(text: string, ok: boolean) {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(""), 4000);
  }

  if (loading) return <p className="text-gray-500 text-center mt-8">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Gestión de usuarios</h1>
        <button
          onClick={() => { setCreating(true); setMsg(""); }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Nuevo usuario
        </button>
      </div>

      {msg && (
        <p className={`text-sm font-medium px-4 py-2 rounded-lg ${msgOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </p>
      )}

      {/* Create form */}
      {creating && (
        <form onSubmit={createUser} className="bg-white rounded-xl shadow p-5 space-y-4 max-w-md">
          <h2 className="font-semibold text-gray-800">Nuevo usuario</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Usuario", key: "username", type: "text" },
              { label: "Contraseña temporal", key: "password", type: "password" },
              { label: "Nombre completo", key: "nombre", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key} className={key === "nombre" ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type}
                  required
                  value={(newUser as Record<string, string>)[key]}
                  onChange={(e) => setNewUser((n) => ({ ...n, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((n) => ({ ...n, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              Crear
            </button>
            <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* User list */}
      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800">{u.nombre}</p>
                <p className="text-sm text-gray-500">@{u.username} · <span className="capitalize">{u.role}</span></p>
              </div>
              <div className="flex gap-2">
                {editing === u.id ? (
                  <>
                    <button onClick={() => saveEdit(u.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Guardar
                    </button>
                    <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(u)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Editar
                    </button>
                    {u.id !== me?.id && (
                      <button onClick={() => deleteUser(u.id, u.nombre)} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                        Eliminar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {editing === u.id && editData && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                    <input
                      value={editData.nombre}
                      onChange={(e) => setEditData((d) => d ? { ...d, nombre: e.target.value } : d)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData((d) => d ? { ...d, role: e.target.value } : d)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                {editData.role !== "admin" && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Permisos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PERM_KEYS.map((k) => (
                        <PermToggle
                          key={k}
                          label={PERM_LABELS[k]}
                          checked={!!editData.permisos[k]}
                          onChange={() => togglePerm(k)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
