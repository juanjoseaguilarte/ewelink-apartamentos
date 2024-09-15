document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch("http://185.253.154.145:3002/api/usuarioall");
    if (response.ok) {
      const reservas = await response.json();

      const fechaActual = new Date().toISOString().split("T")[0];

      const tbodyAnteriores = document.querySelector(
        "#reservasAnterioresTable tbody"
      );
      const tbodyFuturas = document.querySelector(
        "#reservasFuturasTable tbody"
      );

      const reservasAnteriores = reservas.filter(
        (reserva) => reserva.fecha_salida < fechaActual
      );
      const reservasFuturas = reservas.filter(
        (reserva) => reserva.fecha_salida >= fechaActual
      );

      // Rellenar la tabla de reservas anteriores
      tbodyAnteriores.innerHTML = reservasAnteriores
        .map((reserva) => crearFilaReserva(reserva))
        .join("");

      // Rellenar la tabla de reservas actuales o futuras
      tbodyFuturas.innerHTML = reservasFuturas
        .map((reserva) => crearFilaReserva(reserva))
        .join("");

      // Añadir eventos de copia a los botones
      document.querySelectorAll(".copy-link-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          // Cambiar la ruta del enlace al archivo HTML
          const link = `http://185.253.154.145:3002/klsdkdslkds9009sdklsdlkdskl.html?id=${id}`;

          console.log(`Copiando enlace: ${link}`); // Debugging
          copiarAlPortapapeles(link);
        });
      });

      // Añadir eventos de borrado a los botones
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          if (confirm("¿Estás seguro de que deseas eliminar esta reserva?")) {
            borrarReserva(id);
          }
        });
      });
    } else {
      document.getElementById("msg").textContent =
        "Error al cargar las reservas.";
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
                <td>${reserva.pin}</td>
                <td>
                    <div class="button-container">
                        <a href="editreserva.html?id=${reserva.id}" class="edit-btn">Editar</a>
                        <button class="copy-link-btn" data-id="${reserva.id}">Copiar Link</button>
                        <button class="delete-btn" data-id="${reserva.id}">Borrar</button>
                    </div>
                </td>
            </tr>
        `;
}

// Función para copiar al portapapeles
function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        alert("Enlace copiado al portapapeles: " + texto);
      })
      .catch((err) => {
        alert("Error al copiar el enlace: " + err);
      });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      alert("Enlace copiado al portapapeles: " + texto);
    } catch (err) {
      alert("Error al copiar el enlace: " + err);
    }
    document.body.removeChild(textArea);
  }
}

// Función para borrar la reserva
async function borrarReserva(id) {
  try {
    const response = await fetch(
      `http://185.253.154.145:3002/api/usuario/${id}`,
      {
        method: "DELETE",
      }
    );
    if (response.ok) {
      alert("Reserva eliminada exitosamente.");
      location.reload(); // Recargar la página para actualizar la lista
    } else {
      alert("Error al eliminar la reserva.");
    }
  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
}
