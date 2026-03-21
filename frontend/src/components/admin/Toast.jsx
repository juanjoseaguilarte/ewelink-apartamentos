import { useEffect } from 'react'

const COLORS = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
}

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium
        ${COLORS[toast.type] || COLORS.info} animate-fade-in`}
    >
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
    </div>
  )
}
