import { useState, useEffect } from 'react'

const EMPTY_FORM = {
  nombre: '',
  apellido: '',
  fecha_entrada: '',
  fecha_salida: '',
  hora_entrada: '16:00',
  hora_salida: '12:00',
  intentos: 5,
  pin: '',
}

export default function ReservationModal({ reservation, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (reservation) {
      setForm({
        nombre: reservation.nombre || '',
        apellido: reservation.apellido || '',
        fecha_entrada: reservation.fecha_entrada || '',
        fecha_salida: reservation.fecha_salida || '',
        hora_entrada: reservation.hora_entrada || '16:00',
        hora_salida: reservation.hora_salida || '12:00',
        intentos: reservation.intentos ?? 5,
        pin: reservation.pin || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [reservation])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {reservation ? 'Editar Reserva' : 'Nueva Reserva'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
            <Field label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha Entrada" name="fecha_entrada" type="date" value={form.fecha_entrada} onChange={handleChange} required />
            <Field label="Fecha Salida" name="fecha_salida" type="date" value={form.fecha_salida} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hora Entrada" name="hora_entrada" type="time" value={form.hora_entrada} onChange={handleChange} />
            <Field label="Hora Salida" name="hora_salida" type="time" value={form.hora_salida} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Intentos" name="intentos" type="number" min="1" value={form.intentos} onChange={handleChange} required />
            <Field label="PIN Caja Seguridad" name="pin" value={form.pin} onChange={handleChange} maxLength={4} pattern="\d{4}" required />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : reservation ? 'Guardar Cambios' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, required, ...rest }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...rest}
      />
    </div>
  )
}
