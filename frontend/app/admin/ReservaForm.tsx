"use client";

import { useState } from "react";

export type ReservaFields = {
  nombre: string;
  apellido: string;
  fecha_entrada: string;
  fecha_salida: string;
  hora_entrada: string;
  hora_salida: string;
  intentos: string;
  pin: string;
  property_id: string;
};

export const defaultFields: ReservaFields = {
  nombre: "",
  apellido: "",
  fecha_entrada: "",
  fecha_salida: "",
  hora_entrada: "16:00",
  hora_salida: "12:00",
  intentos: "5",
  pin: "",
  property_id: "",
};

export type Propiedad = { id: string; nombre: string; direccion: string };

type Props = {
  initial?: Partial<ReservaFields>;
  onSubmit: (fields: ReservaFields) => Promise<{ ok: boolean; error?: string }>;
  submitLabel: string;
  successMsg: string;
  propiedades?: Propiedad[];
};

function Field({
  label, name, type = "text", value, onChange, required = true, min, max, placeholder,
}: {
  label: string; name: keyof ReservaFields; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean; min?: string; max?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default function ReservaForm({ initial = {}, onSubmit, submitLabel, successMsg, propiedades }: Props) {
  const [fields, setFields] = useState<ReservaFields>({ ...defaultFields, ...initial });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  function set(key: keyof ReservaFields) {
    return (v: string) => setFields((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const result = await onSubmit(fields);
    if (result.ok) {
      setMsg(successMsg);
      setMsgOk(true);
    } else {
      setMsg(result.error ?? "Error");
      setMsgOk(false);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" name="nombre" value={fields.nombre} onChange={set("nombre")} />
        <Field label="Apellido" name="apellido" value={fields.apellido} onChange={set("apellido")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha entrada" name="fecha_entrada" type="date" value={fields.fecha_entrada} onChange={set("fecha_entrada")} />
        <Field label="Fecha salida" name="fecha_salida" type="date" value={fields.fecha_salida} onChange={set("fecha_salida")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Hora entrada" name="hora_entrada" type="time" value={fields.hora_entrada} onChange={set("hora_entrada")} />
        <Field label="Hora salida" name="hora_salida" type="time" value={fields.hora_salida} onChange={set("hora_salida")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Intentos" name="intentos" type="number" min="1" max="100" value={fields.intentos} onChange={set("intentos")} />
        <Field label="PIN caja fuerte" name="pin" value={fields.pin} onChange={set("pin")} placeholder="ej. 1234" />
      </div>
      {propiedades && propiedades.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad</label>
          <select
            value={fields.property_id}
            onChange={(e) => setFields((f) => ({ ...f, property_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Sin asignar —</option>
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}{p.direccion ? ` · ${p.direccion}` : ""}</option>
            ))}
          </select>
        </div>
      )}
      {msg && (
        <p className={`text-sm font-medium ${msgOk ? "text-green-600" : "text-red-600"}`}>{msg}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
