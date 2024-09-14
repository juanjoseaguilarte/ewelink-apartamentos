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

// Endpoint para obtener usuario por ID desde la base de datos
app.get("/usuarioall", async (req, res) => {
  // Verificar si el usuario existe en la base de datos
  db.all(`SELECT * FROM usuarios`, (err, user) => {
    if (err || !user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Enviar los datos del usuario como respuesta
    res.json(user);
    console.log(user);
  });
});

// Endpoint para obtener usuario por ID desde la base de datos
app.get("/usuario/:id", async (req, res) => {
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
app.post("/usuario", (req, res) => {
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
app.get("/toggle-device", async (req, res) => {
  const userId = req.query.userId; // Asumimos que el ID del usuario viene en la consulta
  const deviceId = process.env.DEVICE_ID; // Leer ID del dispositivo desde variables de entorno

  if (!userId) {
    return res.status(400).send("Falta el ID del usuario");
  }

  // Verificar si el usuario tiene intentos disponibles
  db.get(`SELECT * FROM usuarios WHERE id = ?`, [userId], async (err, user) => {
    if (err || !user) {
      return res.status(404).send("Usuario no encontrado");
    }

    if (user.intentos > 0) {
      try {
        // Accionar el dispositivo a través de eWeLink
        const device = await connection.getDevice(deviceId);
        await connection.toggleDevice(deviceId);

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
  });
});

// Manejo de rutas 404
app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
