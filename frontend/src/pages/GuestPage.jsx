import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'
import { formatDate, isWithinAllowedTime } from '../utils/dateUtils'
import { translations } from '../utils/translations'

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Avenida+La+Banqueta+14+3-1'

export default function GuestPage() {
  const { id } = useParams()
  const [lang, setLang] = useState('es')
  const t = translations[lang]

  const [guest, setGuest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [opening, setOpening] = useState(false)
  const [doorMsg, setDoorMsg] = useState(null) // { text, type }

  const fetchGuest = useCallback(async () => {
    try {
      const data = await api.getReservation(id)
      setGuest(data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGuest()
  }, [fetchGuest])

  const allowed = guest
    ? isWithinAllowedTime(guest.fecha_entrada, guest.fecha_salida, guest.hora_entrada, guest.hora_salida)
    : false

  const handleOpenDoor = async () => {
    if (!window.confirm(t.confirmOpen)) return
    setOpening(true)
    setDoorMsg(null)
    try {
      await api.toggleDevice(id)
      setDoorMsg({ text: t.doorOpened, type: 'success' })
      await fetchGuest()
    } catch (err) {
      setDoorMsg({ text: `${t.errorOpening}: ${err.message}`, type: 'error' })
    } finally {
      setOpening(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-lg font-semibold text-gray-800">{t.notFound}</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex flex-col items-center justify-start py-8 px-4">
      {/* Translate button */}
      <div className="w-full max-w-sm flex justify-end mb-4">
        <button
          onClick={() => setLang((l) => (l === 'es' ? 'en' : 'es'))}
          className="text-xs px-3 py-1.5 rounded-full border border-white/30 text-white/80 hover:bg-white/10 transition-colors backdrop-blur-sm"
        >
          {t.translateBtn}
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-sm space-y-4">
        {/* Title */}
        <div className="text-center text-white mb-2">
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-blue-300 text-sm mt-1">{t.autonomousArrival} · {t.noSchedules}</p>
        </div>

        {/* Guest info card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 text-white space-y-2">
          <h2 className="text-lg font-semibold">{guest.nombre} {guest.apellido}</h2>
          <div className="grid grid-cols-2 gap-y-1 text-sm text-white/80">
            <span className="text-white/50 text-xs uppercase tracking-wide">{t.checkIn}</span>
            <span className="text-white/50 text-xs uppercase tracking-wide">{t.checkOut}</span>
            <span>{formatDate(guest.fecha_entrada, lang === 'es' ? 'es-ES' : 'en-GB')}</span>
            <span>{formatDate(guest.fecha_salida, lang === 'es' ? 'es-ES' : 'en-GB')}</span>
            <span className="text-white/50 text-xs uppercase tracking-wide mt-1">{t.checkInTime}</span>
            <span className="text-white/50 text-xs uppercase tracking-wide mt-1">{t.checkOutTime}</span>
            <span>{guest.hora_entrada}</span>
            <span>{guest.hora_salida}</span>
          </div>
          <div className="pt-2 border-t border-white/20 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${guest.intentos > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm">
              {t.attemptsRemaining}: <strong>{guest.intentos}</strong>
            </span>
          </div>
        </div>

        {/* PIN card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 text-center">
          <p className="text-xs text-white/50 uppercase tracking-wide mb-2">{t.pinLabel}</p>
          {allowed ? (
            <div className="text-4xl font-bold font-mono text-white tracking-[0.3em] py-2">
              {guest.pin}
            </div>
          ) : (
            <div className="text-4xl font-bold font-mono text-white/30 tracking-[0.3em] py-2 blur-sm select-none">
              {guest.pin}
            </div>
          )}
          {!allowed && (
            <p className="text-xs text-orange-300 mt-1">{t.pinHidden}</p>
          )}
        </div>

        {/* Attempts info */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 text-white/80 text-sm text-center">
          <p className="font-medium text-white mb-1">{t.attemptsInfo(guest.intentos)}</p>
          <p className="text-xs text-white/60">{t.instructions}</p>
        </div>

        {/* Address */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 space-y-2">
          <p className="text-white text-sm text-center">{t.address}</p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm px-4 py-2 rounded-xl border border-emerald-400/50 text-emerald-300 hover:bg-emerald-400/10 transition-colors"
          >
            🗺 {t.mapsLink}
          </a>
        </div>

        {/* Open door button */}
        <button
          onClick={handleOpenDoor}
          disabled={!allowed || guest.intentos <= 0 || opening}
          className={`w-full py-5 rounded-2xl text-lg font-bold transition-all duration-200 shadow-lg
            ${allowed && guest.intentos > 0 && !opening
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 active:scale-95 shadow-green-500/30'
              : 'bg-white/10 text-white/30 border border-white/20 cursor-not-allowed'
            }`}
        >
          {opening ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.opening}
            </span>
          ) : (
            <span>🔓 {t.openDoor}</span>
          )}
        </button>

        {!allowed && (
          <p className="text-center text-sm text-orange-300">{t.outOfTime}</p>
        )}
        {allowed && guest.intentos <= 0 && (
          <p className="text-center text-sm text-red-400">{t.noAttempts}</p>
        )}

        {/* Door message */}
        {doorMsg && (
          <div
            className={`rounded-xl px-4 py-3 text-sm text-center font-medium ${
              doorMsg.type === 'success'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            {doorMsg.text}
          </div>
        )}
      </div>
    </div>
  )
}
