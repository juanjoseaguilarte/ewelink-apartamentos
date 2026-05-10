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
};

type EWDevice = {
  deviceid: string;
  name: string;
  online: boolean;
  switch: string;
};

export default function PropiedadesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"propiedades" | "dispositivos">("propiedades");
  const [props, setProps] = useState<Propiedad[]>([]);
  const [devices, setDevices] = useState<EWDevice[]>([]);
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ nombre: string; direccion: string; device_id: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [newProp, setNewProp] = useState({ nombre: "", direccion: "", device_id: "" });
  const [assigning, setAssigning] = useState<string | null>(null); // deviceid being saved
  const [deviceAssign, setDeviceAssign] = useState<Record<string, string>>({}); // deviceid → property_id
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  const me = getUser();

  useEffect(() => {
    if (me?.role !== "admin") { router.replace("/admin"); return; }
    loadProps();
  }, []);

  async function loadProps() {
    setLoading(true);
    const res = await authFetch("/api/system/propiedades");
    if (res.ok) setProps(await res.json());
    setLoading(false);
  }

  async function loadDevices() {
    setDevLoading(true);
    setDevError("");
    try {
      const res = await authFetch("/api/system/ewelink-devices");
      if (res.ok) {
        const list: EWDevice[] = await res.json();
        setDevices(list);
        // Pre-fill assignments from current property.device_id
        const map: Record<string, string> = {};
        for (const d of list) {
          const linked = props.find((p) => p.device_id === d.deviceid);
          if (linked) map[d.deviceid] = linked.id;
        }
        setDeviceAssign(map);
      } else {
        const d = await res.json();
        setDevError(d.error ?? "Error al obtener dispositivos");
      }
    } catch {
      setDevError("Error de conexión con eWeLink");
    }
    setDevLoading(false);
  }

  function flash(text: string, ok: boolean) {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(""), 4000);
  }

  async function saveAssignment(deviceid: string) {
    const propertyId = deviceAssign[deviceid] ?? "";
    setAssigning(deviceid);

    // Clear device_id from any property that currently has this device
    const prev = props.find((p) => p.device_id === deviceid && p.id !== propertyId);
    if (prev) {
      await authFetch(`/api/system/propiedades/${prev.id}`, {
        method: "PUT",
        body: JSON.stringify({ device_id: "" }),
      });
    }

    if (propertyId) {
      const res = await authFetch(`/api/system/propiedades/${propertyId}`, {
        method: "PUT",
        body: JSON.stringify({ device_id: deviceid }),
      });
      if (res.ok) {
        const updated: Propiedad = await res.json();
        setProps((ps) => ps.map((p) => {
          if (p.id === prev?.id) return { ...p, device_id: "" };
          if (p.id === propertyId) return updated;
          return p;
        }));
        flash(`Dispositivo asignado a "${updated.nombre}"`, true);
      } else {
        flash((await res.json()).error ?? "Error", false);
      }
    } else {
      // Unassign only (already cleared prev above)
      if (prev) {
        setProps((ps) => ps.map((p) => p.id === prev.id ? { ...p, device_id: "" } : p));
      }
      flash("Asignación eliminada", true);
    }
    setAssigning(null);
    // Reload props to stay consistent
    const r = await authFetch("/api/system/propiedades");
    if (r.ok) setProps(await r.json());
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

  const propName = (id: string) => props.find((p) => p.id === id)?.nombre ?? "";

  if (loading) return <p className="text-gray-500 text-center mt-8">Cargando...</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-800">Propiedades</h1>

      <div className="flex gap-1 border-b border-gray-200">
        <TabBtn label="Propiedades" active={tab === "propiedades"} onClick={() => setTab("propiedades")} />
        <TabBtn
          label="Dispositivos eWeLink"
          active={tab === "dispositivos"}
          onClick={() => { setTab("dispositivos"); if (devices.length === 0 && !devLoading) loadDevices(); }}
        />
      </div>

      {msg && (
        <p className={`text-sm font-medium px-4 py-2 rounded-lg ${msgOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </p>
      )}

      {/* ── PROPIEDADES TAB ── */}
      {tab === "propiedades" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setCreating(true); setNewProp({ nombre: "", direccion: "", device_id: "" }); setMsg(""); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              + Nueva propiedad
            </button>
          </div>

          {creating && (
            <form onSubmit={createProp} className="bg-white rounded-xl shadow p-5 space-y-3 max-w-lg">
              <h2 className="font-semibold text-gray-800">Nueva propiedad</h2>
              {[
                { label: "Nombre *", key: "nombre", placeholder: "Ej. Apartamento 3-1", required: true },
                { label: "Dirección", key: "direccion", placeholder: "Ej. Avenida La Banqueta 14 3-1", required: false },
              ].map(({ label, key, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    required={required}
                    value={(newProp as Record<string, string>)[key]}
                    onChange={(e) => setNewProp((n) => ({ ...n, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
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
                    <div className="flex flex-wrap gap-3 mt-1">
                      {p.device_id ? (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                          Device: {p.device_id}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin dispositivo asignado</span>
                      )}
                      {p.lock_code && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                          Cerradura: {p.lock_code}
                        </span>
                      )}
                    </div>
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
                    {[
                      { label: "Nombre", key: "nombre" as const },
                      { label: "Dirección", key: "direccion" as const },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <input
                          value={editData[key]}
                          onChange={(e) => setEditData((d) => d ? { ...d, [key]: e.target.value } : d)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">El dispositivo eWeLink se asigna desde la pestaña "Dispositivos eWeLink".</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DISPOSITIVOS TAB ── */}
      {tab === "dispositivos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Asocia cada dispositivo de eWeLink con una propiedad. El cambio se guarda al pulsar "Asignar".
            </p>
            <button
              onClick={loadDevices}
              disabled={devLoading}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {devLoading ? "Cargando..." : "↻ Actualizar"}
            </button>
          </div>

          {devError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {devError}
            </div>
          )}

          {devLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse h-20" />
              ))}
            </div>
          )}

          {!devLoading && !devError && devices.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No se encontraron dispositivos en la cuenta eWeLink.</p>
          )}

          {!devLoading && devices.length > 0 && (
            <div className="space-y-3">
              {devices.map((d) => {
                const linkedProp = props.find((p) => p.device_id === d.deviceid);
                const selectedPropId = deviceAssign[d.deviceid] ?? linkedProp?.id ?? "";
                return (
                  <div key={d.deviceid} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{d.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {d.online ? "En línea" : "Sin conexión"}
                          </span>
                          {d.switch !== "unknown" && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${d.switch === "on" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                              {d.switch === "on" ? "Encendido" : "Apagado"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{d.deviceid}</p>
                        {linkedProp && (
                          <p className="text-xs text-indigo-600 mt-0.5">Asignado a: {linkedProp.nombre}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <select
                        value={selectedPropId}
                        onChange={(e) => setDeviceAssign((da) => ({ ...da, [d.deviceid]: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Sin asignar —</option>
                        {props.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}{p.device_id && p.device_id !== d.deviceid ? " (ya tiene dispositivo)" : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveAssignment(d.deviceid)}
                        disabled={assigning === d.deviceid}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {assigning === d.deviceid ? "..." : "Asignar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
