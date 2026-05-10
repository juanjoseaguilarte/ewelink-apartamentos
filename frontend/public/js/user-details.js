// user-details.js
document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");
  const msgDiv = document.getElementById("msg");
  const openDoorButton = document.getElementById("openDoorButton");

  if (!userId) {
    msgDiv.textContent = "No se proporcionó un ID de usuario.";
    return;
  }

  try {
    await fetchUserData(userId);

    openDoorButton.addEventListener("click", async function () {
      const confirmAction = confirm("¿Está seguro de que desea abrir la puerta? Esto restará un intento.");
      if (!confirmAction) return;

      const originalText = openDoorButton.textContent;
      openDoorButton.disabled = true;
      openDoorButton.textContent = "Abriendo...";

      await openDoor(userId);
      await fetchUserData(userId);

      openDoorButton.disabled = false;
      openDoorButton.textContent = originalText;
    });
  } catch {
    msgDiv.textContent = "Error al conectar con el servidor.";
  }
});

async function fetchUserData(userId) {
  const msgDiv = document.getElementById("msg");
  try {
    const response = await fetch(API_BASE + `/api/usuario/${userId}`);
    if (response.ok) {
      const user = await response.json();
      displayUserInfo(user);
    } else {
      msgDiv.textContent = "Usuario no encontrado.";
    }
  } catch {
    msgDiv.textContent = "Error al conectar con el servidor.";
  }
}

function displayUserInfo(user) {
  const userPinDiv = document.getElementById("userPin");
  const userInfoDiv = document.getElementById("userInfo");
  const attemptsParagraph = document.getElementById("attemptsInfo");
  const openDoorButton = document.getElementById("openDoorButton");

  const formattedFechaEntrada = formatDate(user.fecha_entrada);
  const formattedFechaSalida = formatDate(user.fecha_salida);

  // El backend ya omite el PIN fuera de la ventana horaria
  if (user.pin) {
    userPinDiv.textContent = `Pin Caja Seguridad: ${user.pin}`;
    userPinDiv.classList.remove("blurred");
    openDoorButton.disabled = false;
  } else {
    userPinDiv.textContent = "Pin Caja Seguridad: ****";
    userPinDiv.classList.add("blurred");
    openDoorButton.disabled = true;
  }

  attemptsParagraph.textContent = `Tiene ${user.intentos} intentos para abrir la puerta principal. Suba el ascensor a la tercera planta, y gire a la derecha, es la primera puerta. Se encontrará una cajita de seguridad, introduzca el código que le aparece.`;

  userInfoDiv.innerHTML = `
    <p><strong>Nombre:</strong> ${user.nombre}</p>
    <p><strong>Apellido:</strong> ${user.apellido}</p>
    <p><strong>Fecha de Entrada:</strong> ${formattedFechaEntrada}</p>
    <p><strong>Fecha de Salida:</strong> ${formattedFechaSalida}</p>
    <p><strong>Hora de Entrada:</strong> ${user.hora_entrada}</p>
    <p><strong>Hora de Salida:</strong> ${user.hora_salida}</p>
    <p><strong>Intentos Restantes:</strong> ${user.intentos}</p>
  `;
}

function formatDate(dateString) {
  const options = { day: "2-digit", month: "long", year: "numeric" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}

async function openDoor(userId) {
  const msgDiv = document.getElementById("msg");
  try {
    const response = await fetch(API_BASE + `/api/toggle-device?userId=${userId}`);
    const data = await response.json();
    if (response.ok) {
      msgDiv.textContent = "Puerta abierta exitosamente.";
      msgDiv.className = "text-success";
    } else {
      msgDiv.textContent = "No se pudo abrir la puerta. " + (data.error || "");
      msgDiv.className = "text-danger";
    }
  } catch {
    msgDiv.textContent = "Error al conectar con el servidor.";
    msgDiv.className = "text-danger";
  }
}

function checkAllowedTime(fechaEntrada, fechaSalida, horaEntrada, horaSalida) {
  const entradaDateTime = new Date(fechaEntrada + " " + horaEntrada).getTime();
  const salidaDateTime = new Date(fechaSalida + " " + horaSalida).getTime();
  const now = Date.now();
  return now >= entradaDateTime && now <= salidaDateTime;
}
