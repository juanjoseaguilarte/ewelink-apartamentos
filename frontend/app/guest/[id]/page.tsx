"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

type User = {
  id: string;
  nombre: string;
  apellido: string;
  fecha_entrada: string;
  fecha_salida: string;
  hora_entrada: string;
  hora_salida: string;
  intentos: number;
  pin?: string;
};

const t = {
  es: {
    title: "Apertura de Puerta",
    arrival: "Llegada Autónoma",
    noSchedules: "Sin Horarios",
    address: "Dirección: Avenida La Banqueta 14 3-1",
    mapsLink: "Ver en Google Maps",
    pinLabel: "Pin Caja Seguridad",
    openDoor: "Abrir Puerta",
    opening: "Abriendo...",
    success: "Puerta abierta exitosamente.",
    confirm: "¿Está seguro de que desea abrir la puerta? Esto restará un intento.",
    name: "Nombre",
    surname: "Apellido",
    checkin: "Fecha de Entrada",
    checkout: "Fecha de Salida",
    checkinTime: "Hora de Entrada",
    checkoutTime: "Hora de Salida",
    attemptsLeft: "Intentos Restantes",
    attemptsInfo: (n: number) =>
      `Tiene ${n} intentos para abrir la puerta principal. Suba el ascensor a la tercera planta, gire a la derecha, es la primera puerta. Encontrará una cajita de seguridad; introduzca el código que aparece.`,
    notFound: "Usuario no encontrado.",
    noId: "No se proporcionó un ID de usuario.",
    serverError: "Error al conectar con el servidor.",
    switchLang: "Translate to English",
  },
  en: {
    title: "Door Opening",
    arrival: "Autonomous Arrival",
    noSchedules: "No Schedules",
    address: "Address: Avenida La Banqueta 14 3-1",
    mapsLink: "View on Google Maps",
    pinLabel: "Safe Box PIN",
    openDoor: "Open Door",
    opening: "Opening...",
    success: "Door opened successfully.",
    confirm: "Are you sure you want to open the door? This will use one attempt.",
    name: "Name",
    surname: "Surname",
    checkin: "Check-in Date",
    checkout: "Check-out Date",
    checkinTime: "Check-in Time",
    checkoutTime: "Check-out Time",
    attemptsLeft: "Remaining Attempts",
    attemptsInfo: (n: number) =>
      `You have ${n} attempts to open the main door. Take the elevator to the third floor, turn right — it's the first door. You'll find a small safe box; enter the code shown.`,
    notFound: "User not found.",
    noId: "No user ID provided.",
    serverError: "Error connecting to the server.",
    switchLang: "Traducir al Español",
  },
} as const;

type Lang = keyof typeof t;

function formatDate(dateString: string, lang: Lang) {
  return new Date(dateString).toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function GuestPage() {
  const params = useParams();
  const userId = params?.id as string | undefined;

  const [user, setUser] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [opening, setOpening] = useState(false);
  const [lang, setLang] = useState<Lang>("es");
  const tr = t[lang];

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/usuario/${userId}`);
      if (res.ok) {
        setUser(await res.json());
      } else {
        setMsg(tr.notFound);
      }
    } catch {
      setMsg(tr.serverError);
    }
  }, [userId, tr]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleOpenDoor() {
    if (!confirm(tr.confirm)) return;
    setOpening(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/toggle-device?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setMsg(tr.success);
        setMsgOk(true);
        await fetchUser();
      } else {
        setMsg(data.error ?? tr.serverError);
        setMsgOk(false);
      }
    } catch {
      setMsg(tr.serverError);
      setMsgOk(false);
    }
    setOpening(false);
  }

  if (!userId) {
    return <p className="text-center mt-10 text-gray-600">{tr.noId}</p>;
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">{tr.title}</h1>
          <button
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
          >
            {tr.switchLang}
          </button>
          <div className="space-y-1 text-gray-700 pt-2">
            <p className="font-semibold">{tr.arrival}</p>
            <p className="font-semibold">{tr.noSchedules}</p>
            <p>{tr.address}</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Avenida+La+Banqueta+14+3-1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 border border-green-600 text-green-700 rounded-lg px-3 py-1 text-sm hover:bg-green-50 transition-colors"
            >
              {tr.mapsLink}
            </a>
          </div>
          {user && (
            <p className="text-sm text-gray-500 mt-2 text-left bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              {tr.attemptsInfo(user.intentos)}
            </p>
          )}
        </div>

        {/* PIN + Open Door */}
        <div className="bg-white rounded-xl shadow p-6 text-center space-y-4">
          <div className={`text-3xl font-bold tracking-widest transition-all ${!user?.pin ? "blur-sm opacity-50 select-none" : "text-gray-800"}`}>
            {tr.pinLabel}: {user?.pin ?? "████"}
          </div>
          <button
            onClick={handleOpenDoor}
            disabled={opening || !user?.pin}
            className="w-full py-3 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {opening ? tr.opening : tr.openDoor}
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="bg-white rounded-xl shadow p-6 space-y-2 text-gray-700">
            <Row label={tr.name} value={user.nombre} />
            <Row label={tr.surname} value={user.apellido} />
            <Row label={tr.checkin} value={formatDate(user.fecha_entrada, lang)} />
            <Row label={tr.checkout} value={formatDate(user.fecha_salida, lang)} />
            <Row label={tr.checkinTime} value={user.hora_entrada} />
            <Row label={tr.checkoutTime} value={user.hora_salida} />
            <Row label={tr.attemptsLeft} value={String(user.intentos)} />
          </div>
        )}

        {/* Message */}
        {msg && (
          <p className={`text-center font-medium py-2 ${msgOk ? "text-green-600" : "text-red-600"}`}>
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold">{label}:</span> {value}
    </p>
  );
}
