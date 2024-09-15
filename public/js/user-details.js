// user-details.js
document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");
    const userInfoDiv = document.getElementById("userInfo");
    const msgDiv = document.getElementById("msg");
    const openDoorButton = document.getElementById("openDoorButton");
    const attemptsParagraph = document.getElementById("attemptsInfo");

    if (!userId) {
        msgDiv.textContent = "No se proporcionó un ID de usuario.";
        return;
    }

    try {
        // Obtener datos del usuario por ID
        await fetchUserData(userId);

        // Configurar el botón para abrir la puerta
        openDoorButton.addEventListener("click", async function () {
            // Mostrar alerta de confirmación
            const confirmAction = confirm("¿Está seguro de que desea abrir la puerta? Esto restará un intento.");
            if (confirmAction) {
                await openDoor(userId);
                // Recargar los datos del usuario después de abrir la puerta
                await fetchUserData(userId);
            }
        });
    } catch (error) {
        msgDiv.textContent = "Error al conectar con el servidor.";
    }
});

// Función para obtener los datos del usuario por ID
async function fetchUserData(userId) {
    const msgDiv = document.getElementById("msg");
    try {
        const response = await fetch(`http://185.253.154.145:3002/api/usuario/${userId}`);
        if (response.ok) {
            const user = await response.json();
            displayUserInfo(user);
        } else {
            msgDiv.textContent = "Usuario no encontrado.";
        }
    } catch (error) {
        msgDiv.textContent = "Error al conectar con el servidor.";
    }
}

// Mostrar los datos del usuario
function displayUserInfo(user) {
    const userPinDiv = document.getElementById("userPin");
    const userInfoDiv = document.getElementById("userInfo");
    const attemptsParagraph = document.getElementById("attemptsInfo");

    // Formatear fechas
    const formattedFechaEntrada = formatDate(user.fecha_entrada);
    const formattedFechaSalida = formatDate(user.fecha_salida);

    // Mostrar el PIN de forma destacada
    userPinDiv.textContent = `Pin Caja Seguridad: ${user.pin}`;

    // Actualizar la información sobre los intentos
    attemptsParagraph.textContent = `Tiene ${user.intentos} intentos para abrir la puerta principal. Suba el ascensor a la tercera planta, y gire a la derecha, es la primera puerta. Se encontrará una cajita de seguridad, introduzca el código que le aparece.`;

    // Crear la estructura de información del usuario
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

// Función para formatear fechas al formato "día mes año"
function formatDate(dateString) {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', options);
}

// Función para abrir la puerta
async function openDoor(userId) {
    const msgDiv = document.getElementById("msg");
    try {
        const response = await fetch(`http://185.253.154.145:3002/api/toggle-device?userId=${userId}`);
        if (response.ok) {
            msgDiv.textContent = "Puerta abierta exitosamente.";
        } else {
            console.log(response);
            msgDiv.textContent = "No se pudo abrir la puerta. " + (await response.text());
        }
    } catch (error) {
        msgDiv.textContent = "Error al conectar con el servidor.";
    }
}