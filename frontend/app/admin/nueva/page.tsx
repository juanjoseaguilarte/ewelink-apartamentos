"use client";

import Link from "next/link";
import ReservaForm, { ReservaFields } from "../ReservaForm";
import { authFetch } from "@/lib/auth";

export default function NuevaReservaPage() {
  async function handleSubmit(fields: ReservaFields) {
    const res = await authFetch("/api/usuario", {
      method: "POST",
      body: JSON.stringify({ ...fields, intentos: parseInt(fields.intentos, 10) }),
    });
    const data = await res.json();
    return res.ok ? { ok: true } : { ok: false, error: data.error };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">← Volver</Link>
        <h1 className="text-xl font-bold text-gray-800">Nueva reserva</h1>
      </div>
      <ReservaForm
        onSubmit={handleSubmit}
        submitLabel="Crear reserva"
        successMsg="Reserva creada correctamente"
      />
    </div>
  );
}
