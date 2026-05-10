const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  return res;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function login(username: string, password: string) {
  return request("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function getReservas(token: string) {
  return request("/api/usuarioall", { headers: authHeaders(token) });
}

export async function getReserva(id: string, token: string) {
  return request(`/api/usuario/${id}`, { headers: authHeaders(token) });
}

export async function createReserva(data: object, token: string) {
  return request("/api/usuario", {
    method: "POST",
    body: JSON.stringify(data),
    headers: authHeaders(token),
  });
}

export async function updateReserva(id: string, data: object, token: string) {
  return request(`/api/usuario/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: authHeaders(token),
  });
}

export async function deleteReserva(id: string, token: string) {
  return request(`/api/usuario/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function getGuestData(id: string) {
  return request(`/api/usuario/${id}`);
}

export async function toggleDevice(userId: string) {
  return request(`/api/toggle-device?userId=${userId}`);
}
