const express = require("express");
const ewelink = require("ewelink-api");
const cors = require("cors");
const Database = require("better-sqlite3");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || "changeme-set-JWT_SECRET-in-env";

app.use(express.json({ limit: "20mb" }));
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const toggleDeviceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Espera un momento." },
});

// --- Base de datos ---

const db = new Database(process.env.DB_PATH || "/data/usuarios.db");

db.exec(`
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
  );

  CREATE TABLE IF NOT EXISTS system_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'encargado',
    permisos TEXT NOT NULL DEFAULT '{}',
    must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    default_permisos TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS propiedades (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT NOT NULL DEFAULT '',
    device_id TEXT NOT NULL DEFAULT '',
    lock_code TEXT NOT NULL DEFAULT '',
    lock_code_updated_at TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS damage_reports (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    description TEXT NOT NULL,
    photos TEXT NOT NULL DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Crear admin inicial desde variables de entorno si no existe
function seedAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return;

  const existing = db.prepare("SELECT id FROM system_users WHERE role = 'admin'").get();
  if (existing) return;

  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(
    "INSERT OR IGNORE INTO system_users (id, username, password_hash, nombre, role, permisos) VALUES (?, ?, ?, ?, 'admin', ?)"
  ).run(uuidv4(), adminUsername, hash, "Administrador", JSON.stringify(allPermissions(true)));

  console.log(`Admin inicial creado: ${adminUsername}`);
}

function allPermissions(value) {
  return {
    reservas_ver: value,
    reservas_crear: value,
    reservas_editar: value,
    reservas_eliminar: value,
    mensajes_ver: value,
    mensajes_enviar: value,
    mantenimiento_ver: value,
    mantenimiento_gestionar: value,
    limpieza_ver: value,
    limpieza_gestionar: value,
  };
}

// Migrations for existing deployments
try { db.exec("ALTER TABLE system_users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0"); } catch { /* exists */ }
try { db.exec("ALTER TABLE usuarios ADD COLUMN property_id TEXT DEFAULT NULL"); } catch { /* exists */ }

function seedRoles() {
  const count = db.prepare("SELECT COUNT(*) as c FROM roles").get().c;
  if (count > 0) return;
  const insert = db.prepare("INSERT INTO roles (id, name, display_name, default_permisos) VALUES (?, ?, ?, ?)");
  const rolesData = [
    { name: "encargado", display_name: "Encargado", permisos: allPermissions(true) },
    { name: "mensajes", display_name: "Mensajes", permisos: { ...allPermissions(false), mensajes_ver: true, mensajes_enviar: true } },
    { name: "mantenimiento", display_name: "Mantenimiento", permisos: { ...allPermissions(false), reservas_ver: true, mantenimiento_ver: true, mantenimiento_gestionar: true } },
    { name: "limpiadora", display_name: "Limpiadora", permisos: { ...allPermissions(false), reservas_ver: true, limpieza_ver: true, limpieza_gestionar: true } },
  ];
  for (const r of rolesData) insert.run(uuidv4(), r.name, r.display_name, JSON.stringify(r.permisos));
}

seedAdmin();
seedRoles();
console.log("Conectado a la base de datos SQLite.");

const connection = new ewelink({
  email: process.env.EWELINK_EMAIL,
  password: process.env.EWELINK_PASSWORD,
  region: process.env.EWELINK_REGION,
  APP_ID: process.env.EWELINK_APP_ID,
  APP_SECRET: process.env.EWELINK_APP_SECRET,
});

// --- Middlewares de auth ---

function authMiddleware(req, res, next) {
  const token = (req.headers["authorization"] || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No autorizado" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Solo el administrador puede realizar esta acción" });
  next();
}

function requirePermission(perm) {
  return (req, res, next) => {
    if (req.user?.role === "admin") return next();
    const permisos = req.user?.permisos || {};
    if (!permisos[perm]) return res.status(403).json({ error: "Sin permiso para esta acción" });
    next();
  };
}

// --- Login ---

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Faltan credenciales" });

  try {
    const user = db.prepare("SELECT * FROM system_users WHERE username = ?").get(username);
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Credenciales incorrectas" });

    const permisos = JSON.parse(user.permisos || "{}");
    const token = jwt.sign(
      { id: user.id, username: user.username, nombre: user.nombre, role: user.role, permisos },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ token, role: user.role, nombre: user.nombre, permisos, must_change_password: !!user.must_change_password });
  } catch {
    res.status(500).json({ error: "Error interno" });
  }
});

// --- Gestión de usuarios del sistema (solo admin) ---

app.get("/api/system/users", authMiddleware, adminOnly, (req, res) => {
  try {
    const users = db.prepare("SELECT id, username, nombre, role, permisos, created_at FROM system_users").all();
    res.json(users.map((u) => ({ ...u, permisos: JSON.parse(u.permisos || "{}") })));
  } catch {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.post("/api/system/users", authMiddleware, adminOnly, async (req, res) => {
  const { username, password, nombre, role } = req.body || {};
  if (!username || !password || !role) return res.status(400).json({ error: "Faltan campos requeridos" });

  if (role !== "admin") {
    const roleRow = db.prepare("SELECT id FROM roles WHERE name = ?").get(role);
    if (!roleRow) return res.status(400).json({ error: "Rol inválido" });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    let permisos;
    if (role === "admin") {
      permisos = allPermissions(true);
    } else {
      const roleRow = db.prepare("SELECT default_permisos FROM roles WHERE name = ?").get(role);
      permisos = roleRow ? JSON.parse(roleRow.default_permisos) : allPermissions(false);
    }
    db.prepare(
      "INSERT INTO system_users (id, username, password_hash, nombre, role, permisos, must_change_password) VALUES (?, ?, ?, ?, ?, ?, 1)"
    ).run(id, username, hash, nombre || username, role, JSON.stringify(permisos));
    res.status(201).json({ id, username, nombre: nombre || username, role, permisos });
  } catch (e) {
    if (e.message?.includes("UNIQUE")) return res.status(409).json({ error: "El usuario ya existe" });
    res.status(500).json({ error: "Error al crear el usuario" });
  }
});

app.put("/api/system/users/:id", authMiddleware, adminOnly, async (req, res) => {
  const { nombre, password, role, permisos } = req.body || {};
  const userId = req.params.id;

  // No permitir que el admin se quite el rol a sí mismo
  const target = db.prepare("SELECT * FROM system_users WHERE id = ?").get(userId);
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });
  if (target.role === "admin" && req.user.id === userId && role && role !== "admin") {
    return res.status(400).json({ error: "No puedes cambiar tu propio rol de admin" });
  }

  try {
    const updates = [];
    const values = [];

    if (nombre) { updates.push("nombre = ?"); values.push(nombre); }
    if (role) { updates.push("role = ?"); values.push(role); }
    if (permisos) { updates.push("permisos = ?"); values.push(JSON.stringify(permisos)); }
    if (password) {
      updates.push("password_hash = ?");
      values.push(bcrypt.hashSync(password, 10));
      updates.push("must_change_password = 1");
    }

    if (updates.length === 0) return res.status(400).json({ error: "Nada que actualizar" });

    values.push(userId);
    db.prepare(`UPDATE system_users SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    const updated = db.prepare("SELECT id, username, nombre, role, permisos FROM system_users WHERE id = ?").get(userId);
    res.json({ ...updated, permisos: JSON.parse(updated.permisos || "{}") });
  } catch {
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

app.delete("/api/system/users/:id", authMiddleware, adminOnly, (req, res) => {
  const userId = req.params.id;
  if (req.user.id === userId) return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
  try {
    const result = db.prepare("DELETE FROM system_users WHERE id = ?").run(userId);
    if (result.changes === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar el usuario" });
  }
});

// --- Cambio de contraseña ---

app.post("/api/change-password", authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) return res.status(400).json({ error: "Faltan campos" });
  if (new_password.length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });

  try {
    const user = db.prepare("SELECT * FROM system_users WHERE id = ?").get(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const valid = bcrypt.compareSync(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Contraseña actual incorrecta" });

    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare("UPDATE system_users SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(hash, req.user.id);
    res.json({ message: "Contraseña actualizada" });
  } catch {
    res.status(500).json({ error: "Error interno" });
  }
});

// --- Health ---

app.get("/health", (req, res) => res.json({ status: "ok" }));

// --- Rutas públicas (huésped) ---

const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

function validateReserva({ nombre, apellido, fecha_entrada, fecha_salida, intentos, pin, hora_entrada, hora_salida }) {
  if (!nombre || !apellido || !fecha_entrada || !fecha_salida || !intentos || !pin)
    return "Todos los campos son requeridos";
  if (new Date(fecha_entrada) >= new Date(fecha_salida))
    return "La fecha de entrada debe ser anterior a la fecha de salida";
  const intentosNum = parseInt(intentos, 10);
  if (isNaN(intentosNum) || intentosNum < 1 || intentosNum > 100)
    return "Los intentos deben ser un número entre 1 y 100";
  if (hora_entrada && !TIME_REGEX.test(hora_entrada)) return "Formato de hora_entrada inválido (HH:MM)";
  if (hora_salida && !TIME_REGEX.test(hora_salida)) return "Formato de hora_salida inválido (HH:MM)";
  return null;
}

function isWithinAccessWindow(user) {
  const [entH, entM] = user.hora_entrada.split(":");
  const [salH, salM] = user.hora_salida.split(":");
  const entrada = new Date(user.fecha_entrada);
  entrada.setHours(Number(entH), Number(entM), 0, 0);
  const salida = new Date(user.fecha_salida);
  salida.setHours(Number(salH), Number(salM), 0, 0);
  return new Date() >= entrada && new Date() <= salida;
}

app.get("/api/usuario/:id", (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    const data = { ...user };
    if (!isWithinAccessWindow(user)) delete data.pin;
    res.json(data);
  } catch {
    res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/toggle-device", toggleDeviceLimiter, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Falta el ID del usuario" });
  try {
    const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    if (!isWithinAccessWindow(user)) return res.status(403).json({ error: "Fuera de las fechas u horas permitidas" });
    if (user.intentos <= 0) return res.status(400).json({ error: "No hay intentos disponibles" });
    await connection.toggleDevice(process.env.DEVICE_ID);
    db.prepare("UPDATE usuarios SET intentos = intentos - 1 WHERE id = ? AND intentos > 0").run(userId);
    res.json({ message: "Dispositivo activado" });
  } catch (error) {
    console.error("Error al accionar el dispositivo:", error);
    res.status(500).json({ error: "Error al accionar el dispositivo" });
  }
});

// --- Rutas de reservas (requieren permiso) ---

app.get("/api/usuarioall", authMiddleware, requirePermission("reservas_ver"), (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM usuarios").all());
  } catch {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.post("/api/usuario", authMiddleware, requirePermission("reservas_crear"), (req, res) => {
  const fields = req.body;
  const validationError = validateReserva(fields);
  if (validationError) return res.status(400).json({ error: validationError });
  const { nombre, apellido, fecha_entrada, fecha_salida, intentos, pin, hora_entrada = "16:00", hora_salida = "12:00", property_id = null } = fields;
  const id = uuidv4();
  try {
    db.prepare(
      `INSERT INTO usuarios (id, nombre, apellido, fecha_entrada, fecha_salida, intentos, hora_entrada, hora_salida, pin, property_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, nombre, apellido, fecha_entrada, fecha_salida, parseInt(intentos, 10), hora_entrada, hora_salida, pin, property_id);
    res.status(201).json({ id, nombre, apellido, fecha_entrada, fecha_salida, intentos, hora_entrada, hora_salida, pin, property_id });
  } catch {
    res.status(500).json({ error: "Error al agregar la reserva" });
  }
});

app.put("/api/usuario/:id", authMiddleware, requirePermission("reservas_editar"), (req, res) => {
  const userId = req.params.id;
  const fields = req.body;
  const validationError = validateReserva(fields);
  if (validationError) return res.status(400).json({ error: validationError });
  const { nombre, apellido, fecha_entrada, fecha_salida, intentos, pin, hora_entrada = "16:00", hora_salida = "12:00", property_id = null } = fields;
  try {
    const result = db.prepare(
      `UPDATE usuarios SET nombre=?, apellido=?, fecha_entrada=?, fecha_salida=?,
       intentos=?, hora_entrada=?, hora_salida=?, pin=?, property_id=? WHERE id=?`
    ).run(nombre, apellido, fecha_entrada, fecha_salida, parseInt(intentos, 10), hora_entrada, hora_salida, pin, property_id, userId);
    if (result.changes === 0) return res.status(404).json({ error: "Reserva no encontrada" });
    res.json({ id: userId, nombre, apellido, fecha_entrada, fecha_salida, intentos, hora_entrada, hora_salida, pin, property_id });
  } catch {
    res.status(500).json({ error: "Error al actualizar la reserva" });
  }
});

app.delete("/api/usuario/:id", authMiddleware, requirePermission("reservas_eliminar"), (req, res) => {
  try {
    const result = db.prepare("DELETE FROM usuarios WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Reserva no encontrada" });
    res.json({ message: "Reserva eliminada correctamente" });
  } catch {
    res.status(500).json({ error: "Error al eliminar la reserva" });
  }
});

// --- Gestión de propiedades (solo admin) ---

app.get("/api/system/propiedades", authMiddleware, adminOnly, (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM propiedades ORDER BY nombre").all());
  } catch {
    res.status(500).json({ error: "Error al obtener propiedades" });
  }
});

app.post("/api/system/propiedades", authMiddleware, adminOnly, (req, res) => {
  const { nombre, direccion = "", device_id = "" } = req.body || {};
  if (!nombre) return res.status(400).json({ error: "El nombre es requerido" });
  try {
    const id = uuidv4();
    db.prepare("INSERT INTO propiedades (id, nombre, direccion, device_id) VALUES (?, ?, ?, ?)").run(id, nombre, direccion, device_id);
    res.status(201).json({ id, nombre, direccion, device_id, lock_code: "", lock_code_updated_at: "" });
  } catch {
    res.status(500).json({ error: "Error al crear la propiedad" });
  }
});

app.put("/api/system/propiedades/:id", authMiddleware, adminOnly, (req, res) => {
  const { nombre, direccion, device_id } = req.body || {};
  try {
    const prop = db.prepare("SELECT id FROM propiedades WHERE id = ?").get(req.params.id);
    if (!prop) return res.status(404).json({ error: "Propiedad no encontrada" });
    const updates = []; const values = [];
    if (nombre !== undefined) { updates.push("nombre = ?"); values.push(nombre); }
    if (direccion !== undefined) { updates.push("direccion = ?"); values.push(direccion); }
    if (device_id !== undefined) { updates.push("device_id = ?"); values.push(device_id); }
    if (updates.length === 0) return res.status(400).json({ error: "Nada que actualizar" });
    values.push(req.params.id);
    db.prepare(`UPDATE propiedades SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    res.json(db.prepare("SELECT * FROM propiedades WHERE id = ?").get(req.params.id));
  } catch {
    res.status(500).json({ error: "Error al actualizar la propiedad" });
  }
});

app.delete("/api/system/propiedades/:id", authMiddleware, adminOnly, (req, res) => {
  try {
    const prop = db.prepare("SELECT id FROM propiedades WHERE id = ?").get(req.params.id);
    if (!prop) return res.status(404).json({ error: "Propiedad no encontrada" });
    const linked = db.prepare("SELECT COUNT(*) as c FROM usuarios WHERE property_id = ?").get(req.params.id).c;
    if (linked > 0) return res.status(409).json({ error: `Hay ${linked} reserva(s) vinculadas a esta propiedad` });
    db.prepare("DELETE FROM propiedades WHERE id = ?").run(req.params.id);
    res.json({ message: "Propiedad eliminada" });
  } catch {
    res.status(500).json({ error: "Error al eliminar la propiedad" });
  }
});

// --- Limpieza: código de cerradura y reportes de daños ---

app.get("/api/limpieza/propiedades", authMiddleware, requirePermission("limpieza_ver"), (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM propiedades ORDER BY nombre").all());
  } catch {
    res.status(500).json({ error: "Error" });
  }
});

app.put("/api/limpieza/lock-code/:propertyId", authMiddleware, requirePermission("limpieza_gestionar"), (req, res) => {
  const { lock_code } = req.body || {};
  if (!lock_code) return res.status(400).json({ error: "El código es requerido" });
  try {
    const prop = db.prepare("SELECT id FROM propiedades WHERE id = ?").get(req.params.propertyId);
    if (!prop) return res.status(404).json({ error: "Propiedad no encontrada" });
    const now = new Date().toISOString();
    db.prepare("UPDATE propiedades SET lock_code = ?, lock_code_updated_at = ? WHERE id = ?").run(lock_code, now, req.params.propertyId);
    res.json({ lock_code, lock_code_updated_at: now });
  } catch {
    res.status(500).json({ error: "Error al actualizar el código" });
  }
});

app.get("/api/limpieza/damage-reports", authMiddleware, requirePermission("limpieza_ver"), (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM damage_reports ORDER BY created_at DESC").all();
    res.json(rows.map((r) => ({ ...r, photos: JSON.parse(r.photos || "[]") })));
  } catch {
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

app.post("/api/limpieza/damage-reports", authMiddleware, requirePermission("limpieza_gestionar"), (req, res) => {
  const { property_id, description, photos = [] } = req.body || {};
  if (!property_id || !description) return res.status(400).json({ error: "Faltan campos requeridos" });
  if (!Array.isArray(photos) || photos.length > 10) return res.status(400).json({ error: "Máximo 10 fotos" });
  try {
    const id = uuidv4();
    db.prepare(
      "INSERT INTO damage_reports (id, property_id, reporter_id, reporter_name, description, photos) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, property_id, req.user.id, req.user.nombre || req.user.username, description, JSON.stringify(photos));
    res.status(201).json({ id, property_id, reporter_name: req.user.nombre || req.user.username, description, photos, created_at: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: "Error al crear el reporte" });
  }
});

app.delete("/api/limpieza/damage-reports/:id", authMiddleware, adminOnly, (req, res) => {
  try {
    const result = db.prepare("DELETE FROM damage_reports WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Reporte no encontrado" });
    res.json({ message: "Reporte eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar el reporte" });
  }
});

// --- Gestión de roles (solo admin) ---

app.get("/api/system/roles", authMiddleware, adminOnly, (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM roles ORDER BY display_name").all();
    res.json(rows.map((r) => ({ ...r, default_permisos: JSON.parse(r.default_permisos) })));
  } catch {
    res.status(500).json({ error: "Error al obtener roles" });
  }
});

app.post("/api/system/roles", authMiddleware, adminOnly, (req, res) => {
  const { name, display_name, default_permisos } = req.body || {};
  if (!name || !display_name || !default_permisos) return res.status(400).json({ error: "Faltan campos requeridos" });
  if (name === "admin") return res.status(400).json({ error: "El nombre 'admin' está reservado" });
  if (!/^[a-z0-9_]+$/.test(name)) return res.status(400).json({ error: "El nombre solo puede contener letras minúsculas, números y guiones bajos" });
  try {
    const id = uuidv4();
    db.prepare("INSERT INTO roles (id, name, display_name, default_permisos) VALUES (?, ?, ?, ?)").run(id, name, display_name, JSON.stringify(default_permisos));
    res.status(201).json({ id, name, display_name, default_permisos });
  } catch (e) {
    if (e.message?.includes("UNIQUE")) return res.status(409).json({ error: "Ya existe un rol con ese nombre" });
    res.status(500).json({ error: "Error al crear el rol" });
  }
});

app.put("/api/system/roles/:id", authMiddleware, adminOnly, (req, res) => {
  const { display_name, default_permisos } = req.body || {};
  if (!display_name && !default_permisos) return res.status(400).json({ error: "Nada que actualizar" });
  try {
    const role = db.prepare("SELECT * FROM roles WHERE id = ?").get(req.params.id);
    if (!role) return res.status(404).json({ error: "Rol no encontrado" });
    const updates = [];
    const values = [];
    if (display_name) { updates.push("display_name = ?"); values.push(display_name); }
    if (default_permisos) { updates.push("default_permisos = ?"); values.push(JSON.stringify(default_permisos)); }
    values.push(req.params.id);
    db.prepare(`UPDATE roles SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    const updated = db.prepare("SELECT * FROM roles WHERE id = ?").get(req.params.id);
    res.json({ ...updated, default_permisos: JSON.parse(updated.default_permisos) });
  } catch {
    res.status(500).json({ error: "Error al actualizar el rol" });
  }
});

app.delete("/api/system/roles/:id", authMiddleware, adminOnly, (req, res) => {
  try {
    const role = db.prepare("SELECT * FROM roles WHERE id = ?").get(req.params.id);
    if (!role) return res.status(404).json({ error: "Rol no encontrado" });
    const usersWithRole = db.prepare("SELECT COUNT(*) as c FROM system_users WHERE role = ?").get(role.name).c;
    if (usersWithRole > 0) return res.status(409).json({ error: `No se puede eliminar: hay ${usersWithRole} usuario(s) con este rol` });
    db.prepare("DELETE FROM roles WHERE id = ?").run(req.params.id);
    res.json({ message: "Rol eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar el rol" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
