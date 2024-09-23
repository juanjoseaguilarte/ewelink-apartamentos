const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");

// Conectar a la base de datos SQLite
const db = new sqlite3.Database("./apartamentos.db", (err) => {
  if (err) {
    return console.error("Error al abrir la base de datos:", err.message);
  }
  console.log("Conectado a la base de datos SQLite.");
  insertarDatos();
});

// Función para insertar datos ficticios
function insertarDatos() {
  db.serialize(() => {
    // Datos ficticios de apartamentos
    const apartamentos = [
      { nombre: "Apartamento 1", direccion: "Calle Falsa 123" },
      { nombre: "Apartamento 2", direccion: "Avenida Principal 456" },
      { nombre: "Apartamento 3", direccion: "Plaza Mayor 789" },
    ];

    // Insertar apartamentos
    apartamentos.forEach((apt) => {
      const id = uuidv4();
      db.run(
        `INSERT INTO apartamentos (id, nombre, direccion) VALUES (?, ?, ?)`,
        [id, apt.nombre, apt.direccion],
        function (err) {
          if (err) {
            return console.error("Error al insertar apartamento:", err.message);
          }
          console.log(`Apartamento ${apt.nombre} insertado con ID ${id}`);
        }
      );
    });

    // Datos ficticios de alquileres
    const alquileres = [
      {
        apartamento_id: "1",
        nombre_inquilino: "Juan Pérez",
        fecha_inicio: "2024-01-01",
        fecha_fin: "2025-01-01",
        importe: 1000,
        tipo_alquiler: "larga_temporada",
        fianza: 1000,
      },
      {
        apartamento_id: "2",
        nombre_inquilino: "Ana López",
        fecha_inicio: "2024-06-01",
        fecha_fin: "2024-12-01",
        importe: 800,
        tipo_alquiler: "larga_temporada",
        fianza: 800,
      },
    ];

    // Insertar alquileres
    alquileres.forEach((alq) => {
      const id = uuidv4();
      db.run(
        `INSERT INTO alquileres (id, apartamento_id, nombre_inquilino, fecha_inicio, fecha_fin, importe, tipo_alquiler, fianza) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          alq.apartamento_id,
          alq.nombre_inquilino,
          alq.fecha_inicio,
          alq.fecha_fin,
          alq.importe,
          alq.tipo_alquiler,
          alq.fianza,
        ],
        function (err) {
          if (err) {
            return console.error("Error al insertar alquiler:", err.message);
          }
          console.log(`Alquiler para ${alq.nombre_inquilino} insertado con ID ${id}`);
        }
      );
    });

    // Datos ficticios de reservas
    const reservas = [
      {
        apartamento_id: "2",
        referencia: "RES001",
        fecha_entrada: "2024-07-01",
        fecha_salida: "2024-07-10",
        importe_estancia: 500,
        importe_limpieza: 50,
        roturas: 0,
        fianza: 200,
      },
      {
        apartamento_id: "3",
        referencia: "RES002",
        fecha_entrada: "2024-08-15",
        fecha_salida: "2024-08-20",
        importe_estancia: 300,
        importe_limpieza: 30,
        roturas: 0,
        fianza: 150,
      },
    ];

    // Insertar reservas
    reservas.forEach((res) => {
      const id = uuidv4();
      db.run(
        `INSERT INTO reservas (id, apartamento_id, referencia, fecha_entrada, fecha_salida, importe_estancia, importe_limpieza, roturas, fianza, fianza_devuelta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          id,
          res.apartamento_id,
          res.referencia,
          res.fecha_entrada,
          res.fecha_salida,
          res.importe_estancia,
          res.importe_limpieza,
          res.roturas,
          res.fianza,
        ],
        function (err) {
          if (err) {
            return console.error("Error al insertar reserva:", err.message);
          }
          console.log(`Reserva ${res.referencia} insertada con ID ${id}`);
        }
      );
    });

    // Datos ficticios de gastos
    const gastos = [
      {
        apartamento_id: "1",
        descripcion: "Reparación de fontanería",
        importe: 150,
        es_recurrente: 0,
        fecha: "2024-09-01",
      },
      {
        apartamento_id: "2",
        descripcion: "Mantenimiento mensual",
        importe: 100,
        es_recurrente: 1,
        fecha: "2024-09-01",
      },
    ];

    // Insertar gastos
    gastos.forEach((gasto) => {
      const id = uuidv4();
      db.run(
        `INSERT INTO gastos (id, apartamento_id, descripcion, importe, es_recurrente, fecha) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, gasto.apartamento_id, gasto.descripcion, gasto.importe, gasto.es_recurrente, gasto.fecha],
        function (err) {
          if (err) {
            return console.error("Error al insertar gasto:", err.message);
          }
          console.log(`Gasto ${gasto.descripcion} insertado con ID ${id}`);
        }
      );
    });
  });
}