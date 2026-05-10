const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("adminToken");
  if (!token) return null;
  return {
    token,
    role: localStorage.getItem("adminRole") ?? "",
    nombre: localStorage.getItem("adminNombre") ?? "",
    permisos: JSON.parse(localStorage.getItem("adminPermisos") ?? "{}"),
  };
}

export function saveSession(data: {
  token: string;
  role: string;
  nombre: string;
  permisos: Record<string, boolean>;
}) {
  localStorage.setItem("adminToken", data.token);
  localStorage.setItem("adminRole", data.role);
  localStorage.setItem("adminNombre", data.nombre);
  localStorage.setItem("adminPermisos", JSON.stringify(data.permisos));
}

export function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminRole");
  localStorage.removeItem("adminNombre");
  localStorage.removeItem("adminPermisos");
  window.location.href = "/login";
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const res = await fetch(API_BASE + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    logout();
  }
  return res;
}
