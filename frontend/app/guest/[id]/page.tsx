"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "");

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

const LANGS = [
  { code: "es", flag: "🇪🇸", locale: "es-ES" },
  { code: "en", flag: "🇬🇧", locale: "en-GB" },
  { code: "fr", flag: "🇫🇷", locale: "fr-FR" },
  { code: "de", flag: "🇩🇪", locale: "de-DE" },
  { code: "pt", flag: "🇵🇹", locale: "pt-PT" },
] as const;

type Lang = (typeof LANGS)[number]["code"];

type Tr = {
  title: string;
  arrival: string;
  noSchedules: string;
  address: string;
  mapsLink: string;
  pinLabel: string;
  openDoor: string;
  opening: string;
  success: string;
  confirm: string;
  name: string;
  surname: string;
  checkin: string;
  checkout: string;
  checkinTime: string;
  checkoutTime: string;
  attemptsLeft: string;
  attemptsInfo: (n: number) => string;
  notFound: string;
  noId: string;
  serverError: string;
};

const t: Record<Lang, Tr> = {
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
    attemptsInfo: (n) =>
      `Tiene ${n} intentos para abrir la puerta principal. Suba el ascensor a la tercera planta, gire a la derecha, es la primera puerta. Encontrará una cajita de seguridad; introduzca el código que aparece.`,
    notFound: "Usuario no encontrado.",
    noId: "No se proporcionó un ID de usuario.",
    serverError: "Error al conectar con el servidor.",
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
    attemptsInfo: (n) =>
      `You have ${n} attempts to open the main door. Take the elevator to the third floor, turn right — it's the first door. You'll find a small safe box; enter the code shown.`,
    notFound: "User not found.",
    noId: "No user ID provided.",
    serverError: "Error connecting to the server.",
  },
  fr: {
    title: "Ouverture de Porte",
    arrival: "Arrivée Autonome",
    noSchedules: "Sans Horaires",
    address: "Adresse : Avenida La Banqueta 14 3-1",
    mapsLink: "Voir sur Google Maps",
    pinLabel: "Code Coffre-fort",
    openDoor: "Ouvrir la Porte",
    opening: "Ouverture...",
    success: "Porte ouverte avec succès.",
    confirm: "Voulez-vous ouvrir la porte ? Cela utilisera une tentative.",
    name: "Prénom",
    surname: "Nom",
    checkin: "Date d'arrivée",
    checkout: "Date de départ",
    checkinTime: "Heure d'arrivée",
    checkoutTime: "Heure de départ",
    attemptsLeft: "Tentatives restantes",
    attemptsInfo: (n) =>
      `Vous avez ${n} tentatives pour ouvrir la porte principale. Prenez l'ascenseur au troisième étage, tournez à droite — c'est la première porte. Vous trouverez un petit coffre ; entrez le code affiché.`,
    notFound: "Utilisateur non trouvé.",
    noId: "Aucun identifiant fourni.",
    serverError: "Erreur de connexion au serveur.",
  },
  de: {
    title: "Türöffnung",
    arrival: "Autonome Ankunft",
    noSchedules: "Keine Zeitpläne",
    address: "Adresse: Avenida La Banqueta 14 3-1",
    mapsLink: "Auf Google Maps ansehen",
    pinLabel: "Safe-Code",
    openDoor: "Tür öffnen",
    opening: "Wird geöffnet...",
    success: "Tür erfolgreich geöffnet.",
    confirm: "Möchten Sie die Tür öffnen? Dies verbraucht einen Versuch.",
    name: "Vorname",
    surname: "Nachname",
    checkin: "Anreisedatum",
    checkout: "Abreisedatum",
    checkinTime: "Anreisezeit",
    checkoutTime: "Abreisezeit",
    attemptsLeft: "Verbleibende Versuche",
    attemptsInfo: (n) =>
      `Sie haben ${n} Versuche, die Haupttür zu öffnen. Fahren Sie mit dem Aufzug in den dritten Stock, biegen Sie rechts ab — es ist die erste Tür. Sie finden einen kleinen Safe; geben Sie den angezeigten Code ein.`,
    notFound: "Benutzer nicht gefunden.",
    noId: "Keine Benutzer-ID angegeben.",
    serverError: "Verbindungsfehler zum Server.",
  },
  pt: {
    title: "Abertura de Porta",
    arrival: "Chegada Autónoma",
    noSchedules: "Sem Horários",
    address: "Endereço: Avenida La Banqueta 14 3-1",
    mapsLink: "Ver no Google Maps",
    pinLabel: "Código do Cofre",
    openDoor: "Abrir Porta",
    opening: "Abrindo...",
    success: "Porta aberta com sucesso.",
    confirm: "Tem certeza que deseja abrir a porta? Isso usará uma tentativa.",
    name: "Nome",
    surname: "Apelido",
    checkin: "Data de Entrada",
    checkout: "Data de Saída",
    checkinTime: "Hora de Entrada",
    checkoutTime: "Hora de Saída",
    attemptsLeft: "Tentativas Restantes",
    attemptsInfo: (n) =>
      `Tem ${n} tentativas para abrir a porta principal. Suba o elevador ao terceiro andar, vire à direita — é a primeira porta. Encontrará um pequeno cofre; introduza o código apresentado.`,
    notFound: "Utilizador não encontrado.",
    noId: "Nenhum ID de utilizador fornecido.",
    serverError: "Erro ao ligar ao servidor.",
  },
};

function formatDate(dateString: string, lang: Lang) {
  const locale = LANGS.find((l) => l.code === lang)?.locale ?? "es-ES";
  return new Date(dateString).toLocaleDateString(locale, {
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

  useEffect(() => { fetchUser(); }, [fetchUser]);

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

        {/* Language selector */}
        <div className="flex justify-center gap-2">
          {LANGS.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              title={code.toUpperCase()}
              className={`text-2xl leading-none p-1.5 rounded-lg transition-all ${
                lang === code
                  ? "ring-2 ring-blue-500 bg-white shadow"
                  : "opacity-50 hover:opacity-80"
              }`}
            >
              {flag}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">{tr.title}</h1>
          <div className="space-y-1 text-gray-700 pt-1">
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
    <p><span className="font-semibold">{label}:</span> {value}</p>
  );
}
