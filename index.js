const express = require('express');
const ewelink = require('ewelink-api');
const cors = require('cors');

const app = express();
const port = 8080;

// Configuración de CORS para aceptar todas las solicitudes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Configuración de la conexión a eWeLink
const connection = new ewelink({
  email: 'barelrincon@gmail.com',
  password: '71997199',
  region: 'eu',
  APP_ID: 'Uw83EKZFxdif7XFXEsrpduz5YyjP7nTl',
  APP_SECRET: 'mXLOjea0woSMvK9gw7Fjsy7YlFO4iSu6',
});

// JSON con usuarios
const usuarios = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Perez',
    fecha_entrada: '2023-01-01',
    fecha_salida: '2023-06-01',
    intentos: 3,
  },
  {
    id: 2,
    nombre: 'Maria',
    apellido: 'Gomez',
    fecha_entrada: '2023-02-01',
    fecha_salida: '2023-07-01',
    intentos: 2,
  },
  {
    id: 3,
    nombre: 'Carlos',
    apellido: 'Lopez',
    fecha_entrada: '2023-03-01',
    fecha_salida: '2023-08-01',
    intentos: 1,
  },
  {
    id: 4,
    nombre: 'Ana',
    apellido: 'Martinez',
    fecha_entrada: '2023-04-01',
    fecha_salida: '2023-09-01',
    intentos: 4,
  },
  {
    id: 5,
    nombre: 'Luis',
    apellido: 'Rodriguez',
    fecha_entrada: '2023-05-01',
    fecha_salida: '2023-10-01',
    intentos: 5,
  },
];

// Endpoint para la vista administrativa
app.get('/admin', (req, res) => {
  res.send('Vista Administrativa');
});

// Endpoint para obtener usuario por ID
app.get('/usuario/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const usuario = usuarios.find((u) => u.id === userId);
  if (usuario) {
    res.json(usuario);
  } else {
    res.status(404).send('Usuario no encontrado');
  }
});

// Endpoint para accionar el dispositivo
app.get('/toggle-device', async (req, res) => {
  console.log('Solicitud recibida en /toggle-device');
  try {
    const deviceId = '10017dd321'; // ID del dispositivo que quieres accionar

    // Obtener información del dispositivo (opcional)
    const device = await connection.getDevice(deviceId);
    console.log('Información del dispositivo:');
    console.log(device);

    // Accionar el dispositivo
    await connection.toggleDevice(deviceId);

    res.send('Dispositivo accionado correctamente');
  } catch (error) {
    console.error('Error al accionar el dispositivo:', error);
    res.status(500).send('Error al accionar el dispositivo');
  }
});

// Manejo de rutas 404
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});