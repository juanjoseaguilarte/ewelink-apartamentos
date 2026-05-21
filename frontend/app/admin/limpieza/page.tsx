"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "@/lib/auth";

type Propiedad = {
  id: string;
  nombre: string;
  lock_code: string;
  lock_code_updated_at: string;
};

type DamageReport = {
  id: string;
  property_id: string;
  reporter_name: string;
  description: string;
  photos: string[];
  created_at: string;
};

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
          else { w = Math.round((w * MAX) / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function formatTs(ts: string) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function LimpiezaPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"cerradura" | "daños">("cerradura");
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  // Lock code state
  const [lockInputs, setLockInputs] = useState<Record<string, string>>({});
  const [lockSaving, setLockSaving] = useState<string | null>(null);

  // Damage report state
  const [reportPropId, setReportPropId] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [reportSaving, setReportSaving] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function flash(text: string, ok: boolean) {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(""), 5000);
  }

  useEffect(() => {
    Promise.all([
      authFetch("/api/limpieza/propiedades").then((r) => r.ok ? r.json() : []),
      authFetch("/api/limpieza/damage-reports").then((r) => r.ok ? r.json() : []),
    ]).then(([props, reps]) => {
      setPropiedades(props);
      setReports(reps);
      if (props.length > 0) setReportPropId(props[0].id);
    }).finally(() => setLoading(false));
  }, []);

  async function saveLockCode(propertyId: string) {
    const code = lockInputs[propertyId]?.trim();
    if (!code) return;
    setLockSaving(propertyId);
    const res = await authFetch(`/api/limpieza/lock-code/${propertyId}`, {
      method: "PUT",
      body: JSON.stringify({ lock_code: code }),
    });
    if (res.ok) {
      const data = await res.json();
      setPropiedades((ps) => ps.map((p) => p.id === propertyId ? { ...p, lock_code: data.lock_code, lock_code_updated_at: data.lock_code_updated_at } : p));
      setLockInputs((l) => ({ ...l, [propertyId]: "" }));
      flash("Código actualizado", true);
    } else {
      flash((await res.json()).error ?? "Error", false);
    }
    setLockSaving(null);
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length + reportPhotos.length > 10) {
      flash("Máximo 10 fotos por reporte", false);
      return;
    }
    const compressed = await Promise.all(files.map(compressImage));
    setReportPhotos((prev) => [...prev, ...compressed]);
    e.target.value = "";
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportPropId || !reportDesc.trim()) return;
    setReportSaving(true);
    const res = await authFetch("/api/limpieza/damage-reports", {
      method: "POST",
      body: JSON.stringify({ property_id: reportPropId, description: reportDesc, photos: reportPhotos }),
    });
    const data = await res.json();
    if (res.ok) {
      setReports((prev) => [data, ...prev]);
      setReportDesc("");
      setReportPhotos([]);
      flash("Reporte enviado correctamente", true);
    } else {
      flash(data.error ?? "Error", false);
    }
    setReportSaving(false);
  }

  async function deleteReport(id: string) {
    if (!confirm("¿Eliminar este reporte?")) return;
    const res = await authFetch(`/api/limpieza/damage-reports/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      flash("Reporte eliminado", true);
    } else {
      flash((await res.json()).error ?? "Error", false);
    }
  }

  const propName = (id: string) => propiedades.find((p) => p.id === id)?.nombre ?? id;

  if (loading) return <p className="text-gray-500 text-center mt-8">Cargando...</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-800">Limpieza</h1>

      <div className="flex gap-1 border-b border-gray-200">
        {(["cerradura", "daños"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "cerradura" ? "Código cerradura" : "Reportar daños"}
          </button>
        ))}
      </div>

      {msg && (
        <p className={`text-sm font-medium px-4 py-2 rounded-lg ${msgOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </p>
      )}

      {/* ── CERRADURA TAB ── */}
      {tab === "cerradura" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">El código persiste hasta que se cambie. Si no se actualiza hoy, se usa el del día anterior.</p>
          {propiedades.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No hay propiedades disponibles.</p>
          )}
          {propiedades.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              <div>
                <p className="font-semibold text-gray-800">{p.nombre}</p>
                {p.lock_code ? (
                  <p className="text-sm text-gray-600 mt-1">
                    Código actual: <span className="font-mono font-bold text-indigo-700 text-base">{p.lock_code}</span>
                    {p.lock_code_updated_at && (
                      <span className="text-xs text-gray-400 ml-2">({formatTs(p.lock_code_updated_at)})</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Sin código registrado</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nuevo código de hoy"
                  value={lockInputs[p.id] ?? ""}
                  onChange={(e) => setLockInputs((l) => ({ ...l, [p.id]: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => saveLockCode(p.id)}
                  disabled={!lockInputs[p.id]?.trim() || lockSaving === p.id}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  {lockSaving === p.id ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DAÑOS TAB ── */}
      {tab === "daños" && (
        <div className="space-y-5">
          {/* Form */}
          <form onSubmit={submitReport} className="bg-white rounded-xl shadow p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Nuevo reporte de daño</h2>

            {propiedades.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Propiedad</label>
                <select
                  value={reportPropId}
                  onChange={(e) => setReportPropId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {propiedades.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción del daño *</label>
              <textarea
                required
                rows={4}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describe los daños encontrados..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Fotos ({reportPhotos.length}/10)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handlePhotos}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={reportPhotos.length >= 10}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40"
              >
                <span className="text-xl">📷</span>
                Añadir fotos / cámara
              </button>
              {reportPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {reportPhotos.map((src, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setReportPhotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={reportSaving || !reportDesc.trim() || !reportPropId}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {reportSaving ? "Enviando..." : "Enviar reporte"}
            </button>
          </form>

          {/* Report list */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">Reportes anteriores</h2>
            {reports.length === 0 && <p className="text-sm text-gray-400">No hay reportes.</p>}
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">{propName(r.property_id)}</p>
                      <p className="text-xs text-gray-400">{formatTs(r.created_at)} · {r.reporter_name}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {expandedReport === r.id ? "Ocultar" : "Ver"}
                      </button>
                      <button
                        onClick={() => deleteReport(r.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{r.description}</p>
                  {r.photos.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">{r.photos.length} foto(s)</p>
                  )}
                </div>

                {expandedReport === r.id && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.description}</p>
                    {r.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {r.photos.map((src, i) => (
                          <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="w-28 h-28 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}
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
