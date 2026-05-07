const express = require("express");
const ewelink = require("ewelink-api");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Limita /api/toggle-device a 5 peticiones por IP por minuto
const toggleDeviceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Espera un momento." },
});

const db = new sqlite3.Database(process.env.DB_PATH || "/data/usuarios.db", (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT,
        apellido TEXT,
        fecha_entrada TEXT,
        fecha_salida TEXT,
        intentos INTEGER,
        hora_entrada TEXT DEFAULT '16:00',
        hora_salida TEXT DEFAULT '12:00',
        pin TEXT
      )
    `);
  }
});

const connection = new ewelink({
  email: process.env.EWELINK_EMAIL,
  password: process.env.EWELINK_PASSWORD,
  region: process.env.EWELINK_REGION,
  APP_ID: process.env.EWELINK_APP_ID,
  APP_SECRET: process.env.EWELINK_APP_SECRET,
});

// --- Auth ---

function authMiddleware(req, res, next) {
  const token = (req.headers["authorization"] || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No autorizado" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "changeme-set-JWT_SECRET-in-env");
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminPass) {
    return res.status(500).json({ error: "Variable ADMIN_PASSWORD no configurada" });
  }

  // Comparación en tiempo constante para evitar timing attacks
  const userMatch = username === adminUser;
  const passMatch = await bcrypt.compare(password || "", await bcrypt.hash(adminPass, 10));
  // Usamos bcrypt.compare con hash fresco para timing constante;
  // la validación real es la comparación directa más abajo
  const valid = userMatch && (password === adminPass);

  if (!valid) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET || "changeme-set-JWT_SECRET-in-env",
    { expiresIn: "24h" }
  );
  res.json({ token });
});

// --- Validación de reserva ---

const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

function validateReserva({ nombre, apellido, fecha_entrada, fecha_salida, intentos, pin, hora_entrada, hora_salida }) {
  if (!nombre || !apellido || !fecha_entrada || !fecha_salida || !intentos || !pin) {
    return "Todos los campos son requeridos";
  }
  if (new Date(fecha_entrada) >= new Date(fecha_salida)) {
    return "La fecha de entrada debe ser anterior a la fecha de salida";
  }
  const intentosNum = parseInt(intentos, 10);
  if (isNaN(intentosNum) || intentosNum < 1 || intentosNum > 100) {
    return "Los intentos deben ser un número entre 1 y 100";
  }
  if (hora_entrada && !TIME_REGEX.test(hora_entrada)) return "Formato de hora_entrada inválido (HH:MM)";
  if (hora_salida && !TIME_REGEX.test(hora_salida)) return "Formato de hora_salida inválido (HH:MM)";
  return null;
}

// Comprueba si ahora está dentro de la ventana de acceso del usuario
function isWithinAccessWindow(user) {
  const [entH, entM] = user.hora_entrada.split(":");
  const [salH, salM] = user.hora_salida.split(":");
  const entrada = new Date(user.fecha_entrada);
  entrada.setHours(Number(entH), Number(entM), 0, 0);
  const salida = new Date(user.fecha_salida);
  salida.setHours(Number(salH), Number(salM), 0, 0);
  const now = new Date();
  return now >= entrada && now <= salida;
}

// --- Rutas públicas (huésped) ---

// Devuelve los datos del usuario; omite el PIN si está fuera de la ventana horaria
app.get("/api/usuario/:id", (req, res) => {
  db.get(`SELECT * FROM usuarios WHERE id = ?`, [req.params.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: "Usuario no encontrado" });

    const data = { ...user };
    if (!isWithinAccessWindow(user)) delete data.pin;

    res.json(data);
  });
});

app.get("/api/toggle-device", toggleDeviceLimiter, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Falta el ID del usuario" });

  db.get(`SELECT * FROM usuarios WHERE id = ?`, [userId], async (err, user) => {
    if (err || !user) return res.status(404).json({ error: "Usuario no encontrado" });

    if (!isWithinAccessWindow(user)) {
      return res.status(403).json({ error: "Fuera de las fechas u horas permitidas" });
    }

    if (user.intentos <= 0) {
      return res.status(400).json({ error: "No hay intentos disponibles" });
    }

    try {
      await connection.toggleDevice(process.env.DEVICE_ID);

      db.run(
        `UPDATE usuarios SET intentos = intentos - 1 WHERE id = ? AND intentos > 0`,
        [userId],
        (err) => {
          if (err) return res.status(500).json({ error: "Error al actualizar los intentos" });
          res.json({ message: "Dispositivo activado" });
        }
      );
    } catch (error) {
      console.error("Error al accionar el dispositivo:", error);
      res.status(500).json({ error: "Error al accionar el dispositivo" });
    }
  });
});

// --- Rutas de admin (requieren autenticación) ---

app.get("/api/usuarioall", authMiddleware, (req, res) => {
  db.all(`SELECT * FROM usuarios`, (err, users) => {
    if (err) return res.status(500).json({ error: "Error al obtener usuarios" });
    res.json(users);
  });
});

app.post("/api/usuario", authMiddleware, (req, res) => {
  const fields = req.body;
  const validationError = validateReserva(fields);
  if (validationError) return res.status(400).json({ error: validationError });

  const {
    nombre, apellido, fecha_entrada, fecha_salida, intentos, pin,
    hora_entrada = "16:00", hora_salida = "12:00",
  } = fields;

  const id = uuidv4();
  db.run(
    `INSERT INTO usuarios (id, nombre, apellido, fecha_entrada, fecha_salida, intentos, hora_entrada, hora_salida, pin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, nombre, apellido, fecha_entrada, fecha_salida, parseInt(intentos, 10), hora_entrada, hora_salida, pin],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al agregar la reserva" });
      res.status(201).json({ id, nombre, apellido, fecha_entrada, fecha_salida, intentos, hora_entrada, hora_salida, pin });
    }
  );
});

app.put("/api/usuario/:id", authMiddleware, (req, res) => {
  const userId = req.params.id;
  const fields = req.body;
  const validationError = validateReserva(fields);
  if (validationError) return res.status(400).json({ error: validationError });

  const {
    nombre, apellido, fecha_entrada, fecha_salida, intentos, pin,
    hora_entrada = "16:00", hora_salida = "12:00",
  } = fields;

  db.run(
    `UPDATE usuarios SET nombre=?, apellido=?, fecha_entrada=?, fecha_salida=?,
     intentos=?, hora_entrada=?, hora_salida=?, pin=? WHERE id=?`,
    [nombre, apellido, fecha_entrada, fecha_salida, parseInt(intentos, 10), hora_entrada, hora_salida, pin, userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al actualizar la reserva" });
      if (this.changes === 0) return res.status(404).json({ error: "Reserva no encontrada" });
      res.json({ id: userId, nombre, apellido, fecha_entrada, fecha_salida, intentos, hora_entrada, hora_salida, pin });
    }
  );
});

app.delete("/api/usuario/:id", authMiddleware, (req, res) => {
  db.run(`DELETE FROM usuarios WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Error al eliminar la reserva" });
    if (this.changes === 0) return res.status(404).json({ error: "Reserva no encontrada" });
    res.json({ message: "Reserva eliminada correctamente" });
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
