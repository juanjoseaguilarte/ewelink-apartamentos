"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getReservas, deleteReserva } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Reserva } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReservas();
  }, []);

  async function loadReservas() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await getReservas(token);
      if (res.status === 401) { router.replace("/login"); return; }
      const data = await res.json();
      setReservas(data);
    } catch {
      setError("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta reserva?")) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await deleteReserva(id, token);
      if (res.ok) setReservas((prev) => prev.filter((r) => r.id !== id));
      else alert("Error al eliminar");
    } catch {
      alert("Error de conexión");
    }
  }

  function copyGuestLink(id: string) {
    const url = `${window.location.origin}/guest/${id}`;
    navigator.clipboard.writeText(url).then(() => alert("Enlace copiado: " + url));
  }

  const today = new Date().toISOString().split("T")[0];
  const futuras = reservas.filter((r) => r.fecha_salida >= today);
  const pasadas = reservas.filter((r) => r.fecha_salida < today);

  if (loading) return <p className="text-gray-500">Cargando reservas...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reservas</h1>
        <Link
          href="/admin/nueva"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Nueva reserva
        </Link>
      </div>

      <ReservasTable
        title="Activas / Próximas"
        reservas={futuras}
        onDelete={handleDelete}
        onCopy={copyGuestLink}
      />
      <ReservasTable
        title="Pasadas"
        reservas={pasadas}
        onDelete={handleDelete}
        onCopy={copyGuestLink}
        muted
      />
    </div>
  );
}

function ReservasTable({
  title,
  reservas,
  onDelete,
  onCopy,
  muted,
}: {
  title: string;
  reservas: Reserva[];
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className={`text-lg font-semibold mb-3 ${muted ? "text-gray-400" : "text-gray-700"}`}>{title}</h2>
      {reservas.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin reservas</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Huésped</th>
                <th className="px-4 py-3 font-medium">Entrada</th>
                <th className="px-4 py-3 font-medium">Salida</th>
                <th className="px-4 py-3 font-medium">PIN</th>
                <th className="px-4 py-3 font-medium">Intentos</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservas.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.nombre} {r.apellido}</td>
                  <td className="px-4 py-3 text-gray-600">{r.fecha_entrada} {r.hora_entrada}</td>
                  <td className="px-4 py-3 text-gray-600">{r.fecha_salida} {r.hora_salida}</td>
                  <td className="px-4 py-3 font-mono">{r.pin}</td>
                  <td className="px-4 py-3">{r.intentos}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/admin/editar/${r.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => onCopy(r.id)}
                        className="text-green-600 hover:underline"
                      >
                        Copiar link
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="text-red-500 hover:underline"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
