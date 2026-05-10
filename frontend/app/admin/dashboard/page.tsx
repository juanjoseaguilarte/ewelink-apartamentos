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

type Role = {
  id: string;
  name: string;
  display_name: string;
  default_permisos: Permisos;
};

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

const PERM_GROUPS = [
  { label: "Reservas", keys: ["reservas_ver", "reservas_crear", "reservas_editar", "reservas_eliminar"] },
  { label: "Mensajes", keys: ["mensajes_ver", "mensajes_enviar"] },
  { label: "Mantenimiento", keys: ["mantenimiento_ver", "mantenimiento_gestionar"] },
  { label: "Limpieza", keys: ["limpieza_ver", "limpieza_gestionar"] },
];

function emptyPermisos(): Permisos {
  return Object.fromEntries(PERM_KEYS.map((k) => [k, false]));
}

function PermToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div onClick={onChange} className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function PermGroups({ permisos, onChange }: { permisos: Permisos; onChange: (key: string) => void }) {
  return (
    <div className="space-y-3">
      {PERM_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{group.label}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {group.keys.map((k) => (
              <PermToggle key={k} label={PERM_LABELS[k]} checked={!!permisos[k]} onChange={() => onChange(k)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PermBadges({ permisos }: { permisos: Permisos }) {
  const active = PERM_KEYS.filter((k) => permisos[k]);
  if (active.length === 0) return <span className="text-xs text-gray-400">Sin permisos</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {active.map((k) => (
        <span key={k} className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">{PERM_LABELS[k]}</span>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"usuarios" | "roles">("usuarios");
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  // User management state
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<{ nombre: string; role: string; permisos: Permisos } | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", nombre: "", role: "" });
  const [newUserPermisos, setNewUserPermisos] = useState<Permisos>(emptyPermisos());

  // Role management state
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editRoleData, setEditRoleData] = useState<{ display_name: string; default_permisos: Permisos } | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", display_name: "", default_permisos: emptyPermisos() });

  const me = getUser();

  useEffect(() => {
    if (me?.role !== "admin") { router.replace("/admin"); return; }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([
      authFetch("/api/system/users"),
      authFetch("/api/system/roles"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (rolesRes.ok) {
      const r = await rolesRes.json();
      setRoles(r);
      if (!newUser.role && r.length > 0) setNewUser((n) => ({ ...n, role: r[0].name }));
    }
    setLoading(false);
  }

  function flash(text: string, ok: boolean) {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(""), 4000);
  }

  // ─── User handlers ────────────────────────────────────────────────────────

  function startEditUser(u: SystemUser) {
    setEditingUser(u.id);
    setEditUserData({ nombre: u.nombre, role: u.role, permisos: { ...u.permisos } });
    setResetPwd("");
    setMsg("");
  }

  function toggleEditPerm(key: string) {
    setEditUserData((d) => d ? { ...d, permisos: { ...d.permisos, [key]: !d.permisos[key] } } : d);
  }

  function onEditRoleChange(role: string) {
    if (!editUserData) return;
    const roleObj = roles.find((r) => r.name === role);
    const permisos = roleObj ? { ...roleObj.default_permisos } : emptyPermisos();
    setEditUserData({ ...editUserData, role, permisos });
  }

  async function saveUser(id: string) {
    if (!editUserData) return;
    const body: Record<string, unknown> = { ...editUserData };
    if (resetPwd) body.password = resetPwd;
    const res = await authFetch(`/api/system/users/${id}`, { method: "PUT", body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...data } : u));
      setEditingUser(null);
      flash(resetPwd ? "Guardado. El usuario deberá cambiar su contraseña." : "Guardado", true);
      setResetPwd("");
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
      flash((await res.json()).error ?? "Error", false);
    }
  }

  function onNewUserRoleChange(role: string) {
    const roleObj = roles.find((r) => r.name === role);
    setNewUser((n) => ({ ...n, role }));
    setNewUserPermisos(roleObj ? { ...roleObj.default_permisos } : emptyPermisos());
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...newUser, permisos: newUser.role !== "admin" ? newUserPermisos : undefined };
    const res = await authFetch("/api/system/users", { method: "POST", body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => [...prev, data]);
      setCreatingUser(false);
      const firstRole = roles[0]?.name ?? "";
      setNewUser({ username: "", password: "", nombre: "", role: firstRole });
      setNewUserPermisos(roles[0] ? { ...roles[0].default_permisos } : emptyPermisos());
      flash("Usuario creado. Deberá cambiar su contraseña en el primer login.", true);
    } else {
      flash(data.error ?? "Error", false);
    }
  }

  // ─── Role handlers ────────────────────────────────────────────────────────

  function startEditRole(r: Role) {
    setEditingRole(r.id);
    setEditRoleData({ display_name: r.display_name, default_permisos: { ...r.default_permisos } });
    setMsg("");
  }

  async function saveRole(id: string) {
    if (!editRoleData) return;
    const res = await authFetch(`/api/system/roles/${id}`, { method: "PUT", body: JSON.stringify(editRoleData) });
    const data = await res.json();
    if (res.ok) {
      setRoles((prev) => prev.map((r) => r.id === id ? data : r));
      setEditingRole(null);
      flash("Rol actualizado", true);
    } else {
      flash(data.error ?? "Error", false);
    }
  }

  async function deleteRole(id: string, name: string) {
    if (!confirm(`¿Eliminar el rol "${name}"?`)) return;
    const res = await authFetch(`/api/system/roles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRoles((prev) => prev.filter((r) => r.id !== id));
      flash("Rol eliminado", true);
    } else {
      flash((await res.json()).error ?? "Error", false);
    }
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    const res = await authFetch("/api/system/roles", { method: "POST", body: JSON.stringify(newRole) });
    const data = await res.json();
    if (res.ok) {
      setRoles((prev) => [...prev, data].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      setCreatingRole(false);
      setNewRole({ name: "", display_name: "", default_permisos: emptyPermisos() });
      flash("Rol creado", true);
    } else {
      flash(data.error ?? "Error", false);
    }
  }

  if (loading) return <p className="text-gray-500 text-center mt-8">Cargando...</p>;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["usuarios", "roles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "usuarios" ? "Usuarios" : "Roles"}
          </button>
        ))}
      </div>

      {msg && (
        <p className={`text-sm font-medium px-4 py-2 rounded-lg ${msgOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </p>
      )}

      {/* ── USUARIOS TAB ── */}
      {tab === "usuarios" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Usuarios del sistema</h2>
            <button
              onClick={() => {
                setCreatingUser(true);
                const firstRole = roles[0]?.name ?? "";
                setNewUser({ username: "", password: "", nombre: "", role: firstRole });
                setNewUserPermisos(roles[0] ? { ...roles[0].default_permisos } : emptyPermisos());
                setMsg("");
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              + Nuevo usuario
            </button>
          </div>

          {creatingUser && (
            <form onSubmit={createUser} className="bg-white rounded-xl shadow p-5 space-y-4 max-w-lg">
              <h3 className="font-semibold text-gray-800">Nuevo usuario</h3>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { label: "Usuario", key: "username", type: "text" },
                  { label: "Contraseña temporal", key: "password", type: "password" },
                  { label: "Nombre completo", key: "nombre", type: "text" },
                ] as const).map(({ label, key, type }) => (
                  <div key={key} className={key === "nombre" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      type={type}
                      required
                      value={newUser[key]}
                      onChange={(e) => setNewUser((n) => ({ ...n, [key]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => onNewUserRoleChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((r) => <option key={r.name} value={r.name}>{r.display_name}</option>)}
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {newUser.role !== "admin" && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Permisos (pre-rellenados por el rol, editables)</p>
                  <PermGroups permisos={newUserPermisos} onChange={(k) => setNewUserPermisos((p) => ({ ...p, [k]: !p[k] }))} />
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Crear</button>
                <button type="button" onClick={() => setCreatingUser(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{u.nombre}</p>
                    <p className="text-sm text-gray-500">@{u.username} · <span className="capitalize">{u.role}</span></p>
                    {u.role !== "admin" && <PermBadges permisos={u.permisos} />}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {editingUser === u.id ? (
                      <>
                        <button onClick={() => saveUser(u.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Guardar</button>
                        <button onClick={() => setEditingUser(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditUser(u)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Editar</button>
                        {u.id !== me?.id && (
                          <button onClick={() => deleteUser(u.id, u.nombre)} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Eliminar</button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {editingUser === u.id && editUserData && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                        <input
                          value={editUserData.nombre}
                          onChange={(e) => setEditUserData((d) => d ? { ...d, nombre: e.target.value } : d)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                        <select
                          value={editUserData.role}
                          onChange={(e) => onEditRoleChange(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {roles.map((r) => <option key={r.name} value={r.name}>{r.display_name}</option>)}
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    {editUserData.role !== "admin" && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Permisos</p>
                        <PermGroups permisos={editUserData.permisos} onChange={toggleEditPerm} />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Resetear contraseña (dejar vacío para no cambiar)</label>
                      <input
                        type="password"
                        placeholder="Nueva contraseña temporal"
                        value={resetPwd}
                        onChange={(e) => setResetPwd(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ROLES TAB ── */}
      {tab === "roles" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Roles personalizados</h2>
            <button
              onClick={() => { setCreatingRole(true); setNewRole({ name: "", display_name: "", default_permisos: emptyPermisos() }); setMsg(""); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              + Nuevo rol
            </button>
          </div>

          <p className="text-sm text-gray-500">Los permisos del rol se asignan por defecto al crear usuarios. Cambiar un rol no afecta a usuarios existentes.</p>

          {creatingRole && (
            <form onSubmit={createRole} className="bg-white rounded-xl shadow p-5 space-y-4 max-w-lg">
              <h3 className="font-semibold text-gray-800">Nuevo rol</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre interno (slug)</label>
                  <input
                    type="text"
                    required
                    placeholder="mi_rol"
                    value={newRole.name}
                    onChange={(e) => setNewRole((r) => ({ ...r, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre visible</label>
                  <input
                    type="text"
                    required
                    placeholder="Mi Rol"
                    value={newRole.display_name}
                    onChange={(e) => setNewRole((r) => ({ ...r, display_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Permisos por defecto</p>
                <PermGroups
                  permisos={newRole.default_permisos}
                  onChange={(k) => setNewRole((r) => ({ ...r, default_permisos: { ...r.default_permisos, [k]: !r.default_permisos[k] } }))}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Crear</button>
                <button type="button" onClick={() => setCreatingRole(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {roles.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{r.display_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.name}</p>
                    <PermBadges permisos={r.default_permisos} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {editingRole === r.id ? (
                      <>
                        <button onClick={() => saveRole(r.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Guardar</button>
                        <button onClick={() => setEditingRole(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditRole(r)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Editar</button>
                        <button onClick={() => deleteRole(r.id, r.display_name)} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Eliminar</button>
                      </>
                    )}
                  </div>
                </div>

                {editingRole === r.id && editRoleData && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre visible</label>
                      <input
                        value={editRoleData.display_name}
                        onChange={(e) => setEditRoleData((d) => d ? { ...d, display_name: e.target.value } : d)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Permisos por defecto</p>
                      <PermGroups
                        permisos={editRoleData.default_permisos}
                        onChange={(k) => setEditRoleData((d) => d ? { ...d, default_permisos: { ...d.default_permisos, [k]: !d.default_permisos[k] } } : d)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
