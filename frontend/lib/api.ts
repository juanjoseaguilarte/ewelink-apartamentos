const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function request(path: string, options: RequestInit = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Auth
export const login = (username: string, password: string) =>
  request("/api/login", { method: "POST", body: JSON.stringify({ username, password }) });

// Reservas huésped (público)
export const getGuestData = (id: string) => request(`/api/usuario/${id}`);
export const toggleDevice = (userId: string) => request(`/api/toggle-device?userId=${userId}`);

// Reservas admin
export const getReservas = (token: string) => request("/api/usuarioall", { headers: auth(token) });
export const getReserva = (id: string, token: string) => request(`/api/usuario/${id}`, { headers: auth(token) });
export const createReserva = (data: object, token: string) =>
  request("/api/usuario", { method: "POST", body: JSON.stringify(data), headers: auth(token) });
export const updateReserva = (id: string, data: object, token: string) =>
  request(`/api/usuario/${id}`, { method: "PUT", body: JSON.stringify(data), headers: auth(token) });
export const deleteReserva = (id: string, token: string) =>
  request(`/api/usuario/${id}`, { method: "DELETE", headers: auth(token) });

// Usuarios del sistema
export const getSystemUsers = (token: string) => request("/api/system/users", { headers: auth(token) });
export const createSystemUser = (data: object, token: string) =>
  request("/api/system/users", { method: "POST", body: JSON.stringify(data), headers: auth(token) });
export const updateSystemUser = (id: string, data: object, token: string) =>
  request(`/api/system/users/${id}`, { method: "PUT", body: JSON.stringify(data), headers: auth(token) });
export const deleteSystemUser = (id: string, token: string) =>
  request(`/api/system/users/${id}`, { method: "DELETE", headers: auth(token) });

export const changePassword = (currentPassword: string, newPassword: string, token: string) =>
  request("/api/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    headers: auth(token),
  });
