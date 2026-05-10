"use client";

import { useEffect, useState } from "react";
import { authFetch, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Propiedad = {
  id: string;
  nombre: string;
  direccion: string;
  device_id: string;
  lock_code: string;
  lock_code_updated_at: string;
  created_at: string;
};

export default function PropiedadesPage() {
  const router = useRouter();
  const [props, setProps] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ nombre: string; direccion: string; device_id: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [newProp, setNewProp] = useState({ nombre: "", direccion: "", device_id: "" });
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  const me = getUser();

  useEffect(() => {
    if (me?.role !== "admin") { router.replace("/admin"); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await authFetch("/api/system/propiedades");
    if (res.ok) setProps(await res.json());
    setLoading(false);
  }

  function flash(text: string, ok: boolean) {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(""), 4000);
  }

  async function createProp(e: React.FormEvent) {
    e.preventDefault();
    const res = await authFetch("/api/system/propiedades", { method: "POST", body: JSON.stringify(newProp) });
    const data = await res.json();
    if (res.ok) {
      setProps((p) => [...p, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setCreating(false);
      setNewProp({ nombre: "", direccion: "", device_id: "" });
      flash("Propiedad creada", true);
    } else {
      flash(data.error ?? "Error", false);
    }
  }

  async function saveProp(id: string) {
    if (!editData) return;
    const res = await authFetch(`/api/system/propiedades/${id}`, { method: "PUT", body: JSON.stringify(editData) });
    const data = await res.json();
    if (res.ok) {
      setProps((p) => p.map((x) => x.id === id ? data : x));
      setEditing(null);
      flash("Guardado", true);
    } else {
      flash(data.error ?? "Error", false);
    }
  }

  async function deleteProp(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    const res = await authFetch(`/api/system/propiedades/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProps((p) => p.filter((x) => x.id !== id));
      flash("Propiedad eliminada", true);
    } else {
      flash((await res.json()).error ?? "Error", false);
    }
  }

  if (loading) return <p className="text-gray-500 text-center mt-8">Cargando...</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Propiedades</h1>
        <button
          onClick={() => { setCreating(true); setNewProp({ nombre: "", direccion: "", device_id: "" }); setMsg(""); }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Nueva propiedad
        </button>
      </div>

      {msg && (
        <p className={`text-sm font-medium px-4 py-2 rounded-lg ${msgOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </p>
      )}

      {creating && (
        <form onSubmit={createProp} className="bg-white rounded-xl shadow p-5 space-y-3 max-w-lg">
          <h2 className="font-semibold text-gray-800">Nueva propiedad</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
            <input
              required
              value={newProp.nombre}
              onChange={(e) => setNewProp((n) => ({ ...n, nombre: e.target.value }))}
              placeholder="Ej. Apartamento 3-1"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
            <input
              value={newProp.direccion}
              onChange={(e) => setNewProp((n) => ({ ...n, direccion: e.target.value }))}
              placeholder="Ej. Avenida La Banqueta 14 3-1"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Device ID (eWeLink)</label>
            <input
              value={newProp.device_id}
              onChange={(e) => setNewProp((n) => ({ ...n, device_id: e.target.value }))}
              placeholder="ID del dispositivo eWeLink"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Crear</button>
            <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          </div>
        </form>
      )}

      {props.length === 0 && !creating && (
        <p className="text-gray-400 text-sm text-center py-8">No hay propiedades. Crea la primera.</p>
      )}

      <div className="space-y-3">
        {props.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800">{p.nombre}</p>
                {p.direccion && <p className="text-sm text-gray-500">{p.direccion}</p>}
                {p.device_id && <p className="text-xs text-gray-400 font-mono mt-0.5">Device: {p.device_id}</p>}
                {p.lock_code && (
                  <p className="text-xs text-indigo-600 mt-0.5">
                    Código cerradura: <span className="font-mono font-bold">{p.lock_code}</span>
                    {p.lock_code_updated_at && (
                      <span className="text-gray-400"> · {new Date(p.lock_code_updated_at).toLocaleDateString("es-ES")}</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {editing === p.id ? (
                  <>
                    <button onClick={() => saveProp(p.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Guardar</button>
                    <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditing(p.id); setEditData({ nombre: p.nombre, direccion: p.direccion, device_id: p.device_id }); }}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Editar
                    </button>
                    <button onClick={() => deleteProp(p.id, p.nombre)} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing === p.id && editData && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input
                    value={editData.nombre}
                    onChange={(e) => setEditData((d) => d ? { ...d, nombre: e.target.value } : d)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                  <input
                    value={editData.direccion}
                    onChange={(e) => setEditData((d) => d ? { ...d, direccion: e.target.value } : d)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Device ID (eWeLink)</label>
                  <input
                    value={editData.device_id}
                    onChange={(e) => setEditData((d) => d ? { ...d, device_id: e.target.value } : d)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
