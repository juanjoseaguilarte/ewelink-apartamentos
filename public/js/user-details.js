// user-details.js
document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");
  const userInfoDiv = document.getElementById("userInfo");
  const msgDiv = document.getElementById("msg");
  const openDoorButton = document.getElementById("openDoorButton");

  if (!userId) {
    msgDiv.textContent = "No se proporcionó un ID de usuario.";
    return;
  }

  try {
    // Obtener datos del usuario por ID
    const response = await fetch(
      `http://185.253.154.145:3002/api/usuario/${userId}`
    );
    if (response.ok) {
      const user = await response.json();
      displayUserInfo(user);

      // Configurar el botón para abrir la puerta
      openDoorButton.addEventListener("click", async function () {
        openDoor(userId);
      });
    } else {
      msgDiv.textContent = "Usuario no encontrado.";
    }
  } catch (error) {
    msgDiv.textContent = "Error al conectar con el servidor.";
  }
});

// Mostrar los datos del usuario
// Mostrar los datos del usuario
function displayUserInfo(user) {
  const userPinDiv = document.getElementById("userPin");
  const userInfoDiv = document.getElementById("userInfo");

  // Mostrar el PIN de forma destacada
  userPinDiv.textContent = `Pin Caja Seguridad: ${user.pin}`;

  // Crear la estructura de información del usuario
  userInfoDiv.innerHTML = `
        <p><strong>Nombre:</strong> ${user.nombre}</p>
        <p><strong>Apellido:</strong> ${user.apellido}</p>
        <p><strong>Fecha de Entrada:</strong> ${user.fecha_entrada}</p>
        <p><strong>Fecha de Salida:</strong> ${user.fecha_salida}</p>
        <p><strong>Hora de Entrada:</strong> ${user.hora_entrada}</p>
        <p><strong>Hora de Salida:</strong> ${user.hora_salida}</p>
        <p><strong>Intentos Restantes:</strong> ${user.intentos}</p>
    `;
}

// Función para abrir la puerta
async function openDoor(userId) {
  const msgDiv = document.getElementById("msg");
  try {
    const response = await fetch(
      `http://185.253.154.145:3002/api/toggle-device?userId=${userId}`
    );
    if (response.ok) {
      msgDiv.textContent = "Puerta abierta exitosamente.";
    } else {
      console.log(response);
      msgDiv.textContent =
        "No se pudo abrir la puerta. " + (await response.text());
    }
  } catch (error) {
    msgDiv.textContent = "Error al conectar con el servidor.";
  }
}
