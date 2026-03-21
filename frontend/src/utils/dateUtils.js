export function formatDate(dateString, locale = 'es-ES') {
  if (!dateString) return ''
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
}

export function isWithinAllowedTime(fechaEntrada, fechaSalida, horaEntrada, horaSalida) {
  const now = new Date()
  const entrada = new Date(`${fechaEntrada}T${horaEntrada}:00`)
  const salida = new Date(`${fechaSalida}T${horaSalida}:00`)
  return now >= entrada && now <= salida
}

export function classifyReservation(r) {
  const now = new Date()
  const salida = new Date(`${r.fecha_salida}T${r.hora_salida || '12:00'}:00`)
  return salida < now ? 'past' : 'active'
}
