import { useState } from 'react'
import { formatDate } from '../../utils/dateUtils'

export default function ReservationTable({ reservations, onEdit, onDelete }) {
  if (reservations.length === 0) {
    return <p className="text-gray-400 text-sm py-4 text-center">Sin reservas</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Nombre</th>
            <th className="px-4 py-3 text-left">Apellido</th>
            <th className="px-4 py-3 text-left">Entrada</th>
            <th className="px-4 py-3 text-left">Salida</th>
            <th className="px-4 py-3 text-center">Intentos</th>
            <th className="px-4 py-3 text-center">PIN</th>
            <th className="px-4 py-3 text-center">Link</th>
            <th className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reservations.map((r) => (
            <ReservationRow key={r.id} reservation={r} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReservationRow({ reservation: r, onEdit, onDelete }) {
  const [pinVisible, setPinVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const guestUrl = `${window.location.origin}/guest/${r.id}`

  const copyLink = () => {
    navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-medium text-gray-800">{r.nombre}</td>
      <td className="px-4 py-3 text-gray-600">{r.apellido}</td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
        <span>{formatDate(r.fecha_entrada)}</span>
        <span className="block text-xs text-gray-400">{r.hora_entrada}</span>
      </td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
        <span>{formatDate(r.fecha_salida)}</span>
        <span className="block text-xs text-gray-400">{r.hora_salida}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
          r.intentos > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          {r.intentos}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => setPinVisible((v) => !v)}
          className="font-mono text-sm text-gray-700 hover:text-blue-600 transition-colors"
          title={pinVisible ? 'Ocultar PIN' : 'Mostrar PIN'}
        >
          {pinVisible ? r.pin : '••••'}
        </button>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={copyLink}
          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
            copied
              ? 'bg-green-50 border-green-300 text-green-600'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {copied ? '✓ Copiado' : 'Copiar link'}
        </button>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(r)}
            className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(r)}
            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
          >
            Borrar
          </button>
        </div>
      </td>
    </tr>
  )
}
