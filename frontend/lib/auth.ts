const TOKEN_KEY = "adminToken";
const USER_KEY = "adminUser";

export interface UserInfo {
  role: string;
  nombre: string;
  permisos: Record<string, boolean>;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUserInfo(info: UserInfo) {
  localStorage.setItem(USER_KEY, JSON.stringify(info));
}

export function getUserInfo(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAdmin(): boolean {
  return getUserInfo()?.role === "admin";
}

export function hasPerm(perm: string): boolean {
  const info = getUserInfo();
  if (!info) return false;
  if (info.role === "admin") return true;
  return !!info.permisos?.[perm];
}
