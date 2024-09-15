document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("http://185.253.154.145:3002/api/usuarioall");
        if (response.ok) {
            const reservas = await response.json();

            const fechaActual = new Date().toISOString().split('T')[0];

            const tbodyAnteriores = document.querySelector("#reservasAnterioresTable tbody");
            const tbodyFuturas = document.querySelector("#reservasFuturasTable tbody");

            const reservasAnteriores = reservas.filter(reserva => reserva.fecha_salida < fechaActual);
            const reservasFuturas = reservas.filter(reserva => reserva.fecha_salida >= fechaActual);

            // Rellenar la tabla de reservas anteriores
            tbodyAnteriores.innerHTML = reservasAnteriores
                .map(reserva => crearFilaReserva(reserva))
                .join("");

            // Rellenar la tabla de reservas actuales o futuras
            tbodyFuturas.innerHTML = reservasFuturas
                .map(reserva => crearFilaReserva(reserva))
                .join("");

            // Añadir eventos de copia a los botones
            document.querySelectorAll('.copy-link-btn').forEach(button => {
                button.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    const link = `http://185.253.154.145:3002/api/usuario/${id}`;
                    console.log(`Copiando enlace: ${link}`); // Debugging
                    copiarAlPortapapeles(link);
                });
            });
        } else {
            document.getElementById("msg").textContent = "Error al cargar las reservas.";
        }
    } catch (error) {
        document.getElementById("msg").textContent = "Error de conexión.";
    }
});

// Crear la fila de la reserva en la tabla
function crearFilaReserva(reserva) {
    return `
        <tr>
            <td>${reserva.nombre}</td>
            <td>${reserva.apellido}</td>
            <td>${reserva.fecha_entrada}</td>
            <td>${reserva.fecha_salida}</td>
            <td>
                <div class="button-container">
                    <a href="editreserva.html?id=${reserva.id}" class="edit-btn">Editar</a>
                    <button class="copy-link-btn" data-id="${reserva.id}">Copiar Link</button>
                </div>
            </td>
        </tr>
    `;
}

// Función para copiar al portapapeles
function copiarAlPortapapeles(texto) {
    // Verificar si la API está disponible
    if (!navigator.clipboard) {
        console.error("La API del portapapeles no está disponible.");
        alert('La función de copiar no es compatible con este navegador.');
        return;
    }

    navigator.clipboard.writeText(texto).then(() => {
        console.log('Enlace copiado al portapapeles: ' + texto); // Debugging
        alert('Enlace copiado al portapapeles: ' + texto);
    }).catch(err => {
        console.error('Error al copiar el enlace:', err); // Debugging
        alert('Error al copiar el enlace: ' + err);
    });
}