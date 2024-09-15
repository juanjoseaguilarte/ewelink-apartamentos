// edit.js
document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");
    console.log(`Obteniendo datos de la reserva con ID: ${userId}`);

    if (!userId) {
        document.getElementById("msg").textContent = "No se proporcionó un ID de reserva.";
        return;
    }

    try {
        // Verificar si la URL es correcta y se está intentando obtener la reserva
        console.log(`Obteniendo datos de la reserva con ID: ${userId}`);
        
        const response = await fetch(`http://185.253.154.145:3002/api/usuario/${userId}`);
        if (response.ok) {
            const reserva = await response.json();
            console.log("Reserva encontrada:", reserva);

            // Rellenar el formulario con los datos de la reserva
            document.getElementById("nombre").value = reserva.nombre || '';
            document.getElementById("apellido").value = reserva.apellido || '';
            document.getElementById("fecha_entrada").value = reserva.fecha_entrada || '';
            document.getElementById("fecha_salida").value = reserva.fecha_salida || '';
            document.getElementById("hora_entrada").value = reserva.hora_entrada || '';
            document.getElementById("hora_salida").value = reserva.hora_salida || '';
            document.getElementById("intentos").value = reserva.intentos || '';
        } else {
            console.error("Error al obtener la reserva:", response.statusText);
            document.getElementById("msg").textContent = "Reserva no encontrada.";
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        document.getElementById("msg").textContent = "Error al conectar con el servidor.";
    }

    // Manejar el evento de envío del formulario
    document.getElementById("editForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const apellido = document.getElementById("apellido").value;
        const fecha_entrada = document.getElementById("fecha_entrada").value;
        const fecha_salida = document.getElementById("fecha_salida").value;
        const hora_entrada = document.getElementById("hora_entrada").value;
        const hora_salida = document.getElementById("hora_salida").value;
        const intentos = document.getElementById("intentos").value;

        const updatedReserva = {
            nombre,
            apellido,
            fecha_entrada,
            fecha_salida,
            hora_entrada,
            hora_salida,
            intentos,
        };

        try {
            console.log("Actualizando reserva:", updatedReserva);

            const updateResponse = await fetch(`http://185.253.154.145:3002/api/usuario/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedReserva),
            });

            if (updateResponse.ok) {
                document.getElementById("msg").textContent = "Reserva actualizada exitosamente.";
            } else {
                console.error("Error al actualizar la reserva:", updateResponse.statusText);
                document.getElementById("msg").textContent = "Error al actualizar la reserva.";
            }
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
            document.getElementById("msg").textContent = "Error al conectar con el servidor.";
        }
    });
});