"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReservaForm, { ReservaFields } from "../../ReservaForm";
import { authFetch } from "@/lib/auth";

export default function EditarReservaPage() {
  const params = useParams();
  const id = params?.id as string;
  const [initial, setInitial] = useState<Partial<ReservaFields> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch(`/api/usuario/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setInitial({
          nombre: data.nombre ?? "",
          apellido: data.apellido ?? "",
          fecha_entrada: data.fecha_entrada ?? "",
          fecha_salida: data.fecha_salida ?? "",
          hora_entrada: data.hora_entrada ?? "16:00",
          hora_salida: data.hora_salida ?? "12:00",
          intentos: String(data.intentos ?? 5),
          pin: data.pin ?? "",
        });
      })
      .catch(() => setError("Error de conexión"));
  }, [id]);

  async function handleSubmit(fields: ReservaFields) {
    const res = await authFetch(`/api/usuario/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...fields, intentos: parseInt(fields.intentos, 10) }),
    });
    const data = await res.json();
    return res.ok ? { ok: true } : { ok: false, error: data.error };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">← Volver</Link>
        <h1 className="text-xl font-bold text-gray-800">Editar reserva</h1>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!initial && !error && <p className="text-gray-500 text-sm">Cargando...</p>}
      {initial && (
        <ReservaForm
          initial={initial}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
          successMsg="Reserva actualizada correctamente"
        />
      )}
    </div>
  );
}
