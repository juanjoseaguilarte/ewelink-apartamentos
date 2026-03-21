const API_URL = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Error ${res.status}`)
  }
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }
  return res.text()
}

export const api = {
  getAllReservations: () => request('/api/usuarioall'),
  getReservation: (id) => request(`/api/usuario/${id}`),
  createReservation: (data) =>
    request('/api/usuario', { method: 'POST', body: JSON.stringify(data) }),
  updateReservation: (id, data) =>
    request(`/api/usuario/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReservation: (id) =>
    request(`/api/usuario/${id}`, { method: 'DELETE' }),
  toggleDevice: (userId) =>
    request(`/api/toggle-device?userId=${userId}`),
}
