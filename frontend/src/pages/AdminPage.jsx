import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'
import { classifyReservation } from '../utils/dateUtils'
import ReservationTable from '../components/admin/ReservationTable'
import ReservationModal from '../components/admin/ReservationModal'
import Toast from '../components/admin/Toast'
import { useToast } from '../hooks/useToast'

export default function AdminPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = crear, objeto = editar
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { toasts, addToast, removeToast } = useToast()

  const load = useCallback(async () => {
    try {
      const data = await api.getAllReservations()
      setReservations(data)
    } catch {
      addToast('Error al cargar las reservas', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  const active = reservations.filter((r) => classifyReservation(r) === 'active')
  const past = reservations.filter((r) => classifyReservation(r) === 'past')

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (r) => {
    setEditing(r)
    setModalOpen(true)
  }

  const handleSave = async (formData) => {
    try {
      if (editing) {
        await api.updateReservation(editing.id, formData)
        addToast('Reserva actualizada correctamente', 'success')
      } else {
        await api.createReservation(formData)
        addToast('Reserva creada correctamente', 'success')
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      addToast(err.message || 'Error al guardar la reserva', 'error')
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return
    try {
      await api.deleteReservation(deleteConfirm.id)
      addToast('Reserva eliminada correctamente', 'success')
      setDeleteConfirm(null)
      await load()
    } catch (err) {
      addToast(err.message || 'Error al eliminar la reserva', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-800">Panel de Administración</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Nueva Reserva
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Activas / Futuras */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <h2 className="text-base font-semibold text-gray-700">
                  Reservas Activas / Futuras
                  <span className="ml-2 text-xs font-normal text-gray-400">({active.length})</span>
                </h2>
              </div>
              <ReservationTable reservations={active} onEdit={openEdit} onDelete={setDeleteConfirm} />
            </section>

            {/* Pasadas */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <h2 className="text-base font-semibold text-gray-700">
                  Reservas Pasadas
                  <span className="ml-2 text-xs font-normal text-gray-400">({past.length})</span>
                </h2>
              </div>
              <ReservationTable reservations={past} onEdit={openEdit} onDelete={setDeleteConfirm} />
            </section>
          </>
        )}
      </main>

      {/* Modal crear/editar */}
      {modalOpen && (
        <ReservationModal
          reservation={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}

      {/* Modal confirmar borrado */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-gray-800 mb-2">¿Eliminar reserva?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Se eliminará la reserva de <strong>{deleteConfirm.nombre} {deleteConfirm.apellido}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
