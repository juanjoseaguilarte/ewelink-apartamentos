const express = require("express");
const ewelink = require("ewelink-api");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose(); // Importar SQLite
const { v4: uuidv4 } = require("uuid"); // Importar uuid para generar GUID
require("dotenv").config(); // Importar dotenv para leer variables de entorno

const app = express();
const port = process.env.PORT || 3002; // Leer el puerto desde variables de entorno o usar el 3000 por defecto

// Middleware para leer JSON
app.use(express.json());

// Configuración de CORS para aceptar todas las solicitudes
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Servir archivos estáticos del frontend desde la carpeta 'public'
app.use(express.static('public'));

// Conectar a la base de datos SQLite (o crearla si no existe)
const db = new sqlite3.Database("./usuarios.db", (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");

    // Crear la tabla de usuarios si no existe
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT,
        apellido TEXT,
        fecha_entrada TEXT,
        fecha_salida TEXT,
        intentos INTEGER,
        hora_entrada TEXT DEFAULT '16:00',
        hora_salida TEXT DEFAULT '12:00'
      )
    `);
  }
});

// Configuración de la conexión a eWeLink usando variables de entorno
const connection = new ewelink({
  email: process.env.EWELINK_EMAIL,
  password: process.env.EWELINK_PASSWORD,
  region: process.env.EWELINK_REGION,
  APP_ID: process.env.EWELINK_APP_ID,
  APP_SECRET: process.env.EWELINK_APP_SECRET,
});

// Rutas de la API
// Endpoint para obtener todos los usuarios desde la base de datos
app.get("/api/usuarioall", async (req, res) => {
  // Verificar si el usuario existe en la base de datos
  db.all(`SELECT * FROM usuarios`, (err, users) => {
    if (err) {
      return res.status(500).send("Error al obtener usuarios");
    }

    // Enviar los datos del usuario como respuesta
    res.json(users);
  });
});

// Endpoint para obtener un usuario por ID desde la base de datos
app.get("/api/usuario/:id", async (req, res) => {
  const userId = req.params.id; // Extraer el ID desde el parámetro de la URL

  // Verificar si el usuario existe en la base de datos
  db.get(`SELECT * FROM usuarios WHERE id = ?`, [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Enviar los datos del usuario como respuesta
    res.json(user);
  });
});

// Endpoint para agregar un nuevo usuario
app.post("/api/usuario", (req, res) => {
  const {
    nombre,
    apellido,
    fecha_entrada,
    fecha_salida,
    intentos,
    hora_entrada,
    hora_salida,
  } = req.body;

  if (!nombre || !apellido || !fecha_entrada || !fecha_salida || !intentos) {
    return res.status(400).send("Todos los campos son requeridos");
  }

  // Hora por defecto: entrada a las 16:00 y salida a las 12:00 si no se especifica
  const defaultHoraEntrada = hora_entrada || "16:00";
  const defaultHoraSalida = hora_salida || "12:00";

  // Generar un UUID para el nuevo usuario
  const id = uuidv4();

  // Modificar la consulta SQL para insertar también las horas de entrada y salida
  const sql = `INSERT INTO usuarios (id, nombre, apellido, fecha_entrada, fecha_salida, intentos, hora_entrada, hora_salida) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    id,
    nombre,
    apellido,
    fecha_entrada,
    fecha_salida,
    intentos,
    defaultHoraEntrada,
    defaultHoraSalida,
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).send("Error al agregar el usuario");
    }
    res.status(201).send({
      id,
      nombre,
      apellido,
      fecha_entrada,
      fecha_salida,
      intentos,
      hora_entrada: defaultHoraEntrada,
      hora_salida: defaultHoraSalida,
    });
  });
});

// Endpoint para accionar el dispositivo y restar intentos
// Modificar el endpoint para accionar el dispositivo y verificar fechas y horarios
app.get("/api/toggle-device", async (req, res) => {
  const userId = req.query.userId; // Obtener el ID del usuario desde los parámetros de la URL

  if (!userId) {
      return res.status(400).send("Falta el ID del usuario");
  }

  // Verificar si el usuario existe y tiene acceso permitido
  db.get(`SELECT * FROM usuarios WHERE id = ?`, [userId], async (err, user) => {
      if (err || !user) {
          return res.status(404).send("Usuario no encontrado");
      }

      // Obtener la fecha y hora actuales
      const fechaActual = new Date().toISOString().split('T')[0];
      const horaActual = new Date().toLocaleTimeString('es-ES', { hour12: false });

      // Verificar si la fecha actual está entre las fechas de entrada y salida del usuario
      if (fechaActual >= user.fecha_entrada && fechaActual <= user.fecha_salida) {
          // Verificar si la hora actual está dentro del horario permitido
          if (horaActual >= user.hora_entrada && horaActual <= user.hora_salida) {
              // Verificar si el usuario tiene intentos disponibles
              if (user.intentos > 0) {
                  try {
                      // Accionar el dispositivo a través de eWeLink
                      await connection.toggleDevice(process.env.DEVICE_ID);

                      // Restar un intento
                      db.run(
                          `UPDATE usuarios SET intentos = intentos - 1 WHERE id = ?`,
                          [userId],
                          (err) => {
                              if (err) {
                                  return res.status(500).send("Error al actualizar los intentos");
                              }
                              res.send("Dispositivo activado y intentos actualizados");
                          }
                      );
                  } catch (error) {
                      console.error("Error al accionar el dispositivo:", error);
                      res.status(500).send("Error al accionar el dispositivo");
                  }
              } else {
                  res.status(400).send("No hay intentos disponibles");
              }
          } else {
              res.status(403).send("Fuera del horario permitido");
          }
      } else {
          res.status(403).send("Fuera de las fechas permitidas");
      }
  });
});


// Endpoint para actualizar una reserva
app.put("/api/usuario/:id", (req, res) => {
  const userId = req.params.id; // Extraer el ID desde el parámetro de la URL
  const {
    nombre,
    apellido,
    fecha_entrada,
    fecha_salida,
    intentos,
    hora_entrada,
    hora_salida,
  } = req.body;

  if (!nombre || !apellido || !fecha_entrada || !fecha_salida || !intentos) {
    return res.status(400).send("Todos los campos son requeridos");
  }

  // Modificar la consulta SQL para actualizar la reserva
  const sql = `UPDATE usuarios SET nombre = ?, apellido = ?, fecha_entrada = ?, fecha_salida = ?, intentos = ?, hora_entrada = ?, hora_salida = ? WHERE id = ?`;
  const params = [
    nombre,
    apellido,
    fecha_entrada,
    fecha_salida,
    intentos,
    hora_entrada || "16:00",
    hora_salida || "12:00",
    userId,
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).send("Error al actualizar la reserva");
    }
    res.status(200).send({
      id: userId,
      nombre,
      apellido,
      fecha_entrada,
      fecha_salida,
      intentos,
      hora_entrada,
      hora_salida,
    });
  });
});

// Manejo de rutas 404
app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
