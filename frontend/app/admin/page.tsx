"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";
import Link from "next/link";


type Reserva = {
  id: string;
  nombre: string;
  apellido: string;
  fecha_entrada: string;
  fecha_salida: string;
  hora_entrada: string;
  hora_salida: string;
  intentos: number;
  pin: string;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function copyGuestLink(id: string) {
  const url = `${window.location.origin}/guest/${id}`;
  navigator.clipboard?.writeText(url).then(
    () => alert("Enlace copiado: " + url),
    () => alert("No se pudo copiar. URL: " + url)
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await authFetch("/api/usuarioall");
      if (res.ok) {
        setReservas(await res.json());
      } else {
        const d = await res.json();
        setMsg(d.error ?? "Error al cargar reservas");
      }
    } catch {
      setMsg("Error de conexión");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta reserva?")) return;
    const res = await authFetch(`/api/usuario/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReservas((prev) => prev.filter((r) => r.id !== id));
    } else {
      const d = await res.json();
      alert(d.error ?? "Error al eliminar");
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const pasadas = reservas.filter((r) => r.fecha_salida <= today);
  const futuras = reservas.filter((r) => r.fecha_salida > today);

  if (loading) return <p className="text-center text-gray-500 mt-8">Cargando reservas...</p>;
  if (msg) return <p className="text-center text-red-600 mt-8">{msg}</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Lista de Reservas</h1>
        <Link
          href="/admin/nueva"
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Nueva reserva
        </Link>
      </div>

      <Section title="Reservas actuales y futuras" reservas={futuras} onDelete={handleDelete} onCopy={copyGuestLink} router={router} />
      <Section title="Reservas anteriores" reservas={pasadas} onDelete={handleDelete} onCopy={copyGuestLink} router={router} />
    </div>
  );
}

function Section({
  title, reservas, onDelete, onCopy, router,
}: {
  title: string;
  reservas: Reserva[];
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-600 mb-3">{title}</h2>
      {reservas.length === 0 ? (
        <p className="text-sm text-gray-400">Sin reservas</p>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-800">{r.nombre} {r.apellido}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(r.fecha_entrada)} ({r.hora_entrada}) → {formatDate(r.fecha_salida)} ({r.hora_salida})
                </p>
                <p className="text-sm text-gray-500">PIN: <span className="font-mono font-bold text-gray-700">{r.pin}</span> · {r.intentos} intentos</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => router.push(`/admin/editar/${r.id}`)}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => onCopy(r.id)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Copiar link
                </button>
                <Link
                  href={`/guest/${r.id}`}
                  target="_blank"
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  Ver enlace
                </Link>
                <button
                  onClick={() => onDelete(r.id)}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
