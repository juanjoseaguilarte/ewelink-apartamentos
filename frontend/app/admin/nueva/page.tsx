"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReserva } from "@/lib/api";
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

export default function NuevaReservaPage() {
  const router = useRouter();
  const [values, setValues] = useState<ReservaFormType>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const res = await createReserva(values, token);
      const data = await res.json();
      if (res.ok) {
        setSuccess("Reserva creada correctamente");
        setValues(empty);
        setTimeout(() => router.push("/admin"), 1000);
      } else {
        setError(data.error ?? "Error al crear la reserva");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nueva Reserva</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <ReservaForm
          values={values}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Crear Reserva"
          error={error}
          success={success}
        />
      </div>
    </div>
  );
}
