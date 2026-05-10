"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getReserva, updateReserva } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { ReservaForm as ReservaFormType } from "@/lib/types";
import ReservaForm from "@/components/ReservaForm";

const empty: ReservaFormType = {
  nombre: "",
  apellido: "",
  fecha_entrada: "",
  fecha_salida: "",
  hora_entrada: "16:00",
  hora_salida: "12:00",
  intentos: 5,
  pin: "",
};

export default function EditarReservaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [values, setValues] = useState<ReservaFormType>(empty);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) { router.replace("/login"); return; }
      try {
        const res = await getReserva(id, token);
        if (res.status === 401) { router.replace("/login"); return; }
        if (res.ok) {
          const data = await res.json();
          setValues(data);
        } else {
          setError("Reserva no encontrada");
        }
      } catch {
        setError("Error de conexión");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id, router]);

  function handleChange(field: keyof ReservaFormType, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) { router.replace("/login"); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateReserva(id, values, token);
      const data = await res.json();
      if (res.ok) {
        setSuccess("Reserva actualizada correctamente");
        setTimeout(() => router.push("/admin"), 1000);
      } else {
        setError(data.error ?? "Error al actualizar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Reserva</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <ReservaForm
          values={values}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Guardar cambios"
          error={error}
          success={success}
        />
      </div>
    </div>
  );
}
