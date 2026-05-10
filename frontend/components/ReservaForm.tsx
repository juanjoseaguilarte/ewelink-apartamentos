"use client";

import { ReservaForm as ReservaFormType } from "@/lib/types";

interface Props {
  values: ReservaFormType;
  onChange: (field: keyof ReservaFormType, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  submitLabel: string;
  error?: string;
  success?: string;
}

export default function ReservaForm({ values, onChange, onSubmit, loading, submitLabel, error, success }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            required
            value={values.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input
            type="text"
            required
            value={values.apellido}
            onChange={(e) => onChange("apellido", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrada</label>
          <input
            type="date"
            required
            value={values.fecha_entrada}
            onChange={(e) => onChange("fecha_entrada", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de salida</label>
          <input
            type="date"
            required
            value={values.fecha_salida}
            onChange={(e) => onChange("fecha_salida", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora de entrada</label>
          <input
            type="time"
            value={values.hora_entrada}
            onChange={(e) => onChange("hora_entrada", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora de salida</label>
          <input
            type="time"
            value={values.hora_salida}
            onChange={(e) => onChange("hora_salida", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Intentos</label>
          <input
            type="number"
            required
            min={1}
            max={100}
            value={values.intentos}
            onChange={(e) => onChange("intentos", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PIN caja seguridad</label>
          <input
            type="text"
            required
            maxLength={4}
            pattern="\d{4}"
            placeholder="4 dígitos"
            value={values.pin}
            onChange={(e) => onChange("pin", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {loading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
