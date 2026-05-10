"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getGuestData, toggleDevice } from "@/lib/api";
import { Reserva } from "@/lib/types";

export default function GuestPage() {
  const { id } = useParams<{ id: string }>();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [opening, setOpening] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");

  useEffect(() => {
    async function load() {
      try {
        const res = await getGuestData(id);
        if (res.ok) {
          setReserva(await res.json());
        } else {
          setError("Reserva no encontrada");
        }
      } catch {
        setError("Error al conectar con el servidor");
      }
    }
    load();
  }, [id]);

  async function handleOpenDoor() {
    const label = lang === "es"
      ? "¿Confirma que desea abrir la puerta? Se restará un intento."
      : "Confirm opening the door? One attempt will be used.";
    if (!confirm(label)) return;
    setOpening(true);
    setMsg("");
    try {
      const res = await toggleDevice(id);
      const data = await res.json();
      if (res.ok) {
        setMsg(lang === "es" ? "Puerta abierta exitosamente" : "Door opened successfully");
        const updated = await getGuestData(id);
        if (updated.ok) setReserva(await updated.json());
      } else {
        setMsg(data.error ?? (lang === "es" ? "No se pudo abrir" : "Could not open"));
      }
    } catch {
      setMsg(lang === "es" ? "Error de conexión" : "Connection error");
    } finally {
      setOpening(false);
    }
  }

  const t = {
    title: lang === "es" ? "Apertura de Puerta" : "Door Access",
    arrival: lang === "es" ? "Llegada Autónoma · Sin Horarios" : "Self Check-in · No Schedule",
    address: "Avenida La Banqueta 14 3-1",
    mapsLabel: lang === "es" ? "Ver en Google Maps" : "View on Google Maps",
    pinLabel: lang === "es" ? "PIN Caja Seguridad" : "Safe Box PIN",
    pinBlocked: lang === "es" ? "Disponible durante tu estancia" : "Available during your stay",
    openDoor: lang === "es" ? "Abrir Puerta" : "Open Door",
    attemptsLeft: (n: number) =>
      lang === "es" ? `${n} intentos restantes` : `${n} attempts left`,
    checkin: lang === "es" ? "Entrada" : "Check-in",
    checkout: lang === "es" ? "Salida" : "Check-out",
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
          <button
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="text-sm text-blue-600 hover:underline"
          >
            {lang === "es" ? "English" : "Español"}
          </button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-gray-500 text-sm">{t.arrival}</p>
          <p className="font-medium">{t.address}</p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Avenida+La+Banqueta+14+3-1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-sm text-green-600 border border-green-500 rounded-lg px-3 py-1 hover:bg-green-50 transition-colors"
          >
            {t.mapsLabel}
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{t.pinLabel}</p>
            {reserva.pin ? (
              <p className="text-4xl font-mono font-bold tracking-widest text-gray-800">{reserva.pin}</p>
            ) : (
              <p className="text-gray-400 italic">{t.pinBlocked}</p>
            )}
          </div>

          <button
            onClick={handleOpenDoor}
            disabled={opening || !reserva.pin || reserva.intentos <= 0}
            className="w-full bg-green-600 text-white py-3 rounded-xl text-lg font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {opening ? "..." : t.openDoor}
          </button>

          <p className="text-sm text-gray-500">{t.attemptsLeft(reserva.intentos)}</p>
          {msg && <p className="text-sm font-medium text-blue-600">{msg}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 text-sm">
          <p><span className="font-medium">{reserva.nombre} {reserva.apellido}</span></p>
          <p><span className="text-gray-500">{t.checkin}:</span> {reserva.fecha_entrada} {reserva.hora_entrada}</p>
          <p><span className="text-gray-500">{t.checkout}:</span> {reserva.fecha_salida} {reserva.hora_salida}</p>
        </div>
      </div>
    </div>
  );
}
