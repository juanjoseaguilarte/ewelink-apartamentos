// script.js

// Función para manejar el envío del formulario
document.getElementById("userForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const fecha_entrada = document.getElementById("fecha_entrada").value;
    const fecha_salida = document.getElementById("fecha_salida").value;
    const hora_entrada = document.getElementById("hora_entrada").value || "16:00";
    const hora_salida = document.getElementById("hora_salida").value || "12:00";
    const intentos = document.getElementById("intentos").value || 5;

    const user = {
        nombre,
        apellido,
        fecha_entrada,
        fecha_salida,
        intentos,
        hora_entrada,
        hora_salida,
    };

    try {
        const response = await fetch("http://185.253.154.145:3002/api/usuario", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        });

        if (response.ok) {
            document.getElementById("msg").textContent = "Reserva agregada exitosamente";
            document.getElementById("userForm").reset();
        } else {
            document.getElementById("msg").textContent = "Error al agregar la reserva";
        }
    } catch (error) {
        document.getElementById("msg").textContent = "Error de conexión";
    }
});