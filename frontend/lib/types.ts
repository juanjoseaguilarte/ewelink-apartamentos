export interface Reserva {
  id: string;
  nombre: string;
  apellido: string;
  fecha_entrada: string;
  fecha_salida: string;
  hora_entrada: string;
  hora_salida: string;
  intentos: number;
  pin?: string;
}

export interface ReservaForm {
  nombre: string;
  apellido: string;
  fecha_entrada: string;
  fecha_salida: string;
  hora_entrada: string;
  hora_salida: string;
  intentos: number | string;
  pin: string;
}

export type Role = "admin" | "encargado" | "mensajes" | "mantenimiento" | "limpiadora";

export interface Permisos {
  reservas_ver: boolean;
  reservas_crear: boolean;
  reservas_editar: boolean;
  reservas_eliminar: boolean;
  mensajes_ver: boolean;
  mensajes_enviar: boolean;
  mantenimiento_ver: boolean;
  mantenimiento_gestionar: boolean;
  limpieza_ver: boolean;
  limpieza_gestionar: boolean;
}

export interface SystemUser {
  id: string;
  username: string;
  nombre: string;
  role: Role;
  permisos: Permisos;
  created_at?: string;
}
