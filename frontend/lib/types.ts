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
