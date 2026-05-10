checkAuth();

document.addEventListener("DOMContentLoaded", async function () {
  const msg = document.getElementById("msg");
  msg.textContent = "Cargando reservas...";
  msg.className = "text-muted";

  try {
    const response = await authFetch(API_BASE + "/api/usuarioall");
    if (!response.ok) {
      const data = await response.json();
      msg.textContent = data.error || "Error al cargar las reservas.";
      msg.className = "text-danger";
      return;
    }

    const reservas = await response.json();
    msg.textContent = "";

    const fechaActual = new Date().toISOString().split("T")[0];
    const reservasAnteriores = reservas.filter((r) => r.fecha_salida <= fechaActual);
    const reservasFuturas = reservas.filter((r) => r.fecha_salida > fechaActual);

    document.querySelector("#reservasAnterioresTable tbody").innerHTML =
      reservasAnteriores.map(crearFilaReserva).join("");
    document.querySelector("#reservasFuturasTable tbody").innerHTML =
      reservasFuturas.map(crearFilaReserva).join("");

    document.querySelectorAll(".copy-link-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        const link = `${window.location.origin}/klsdkdslkds9009sdklsdlkdskl.html?id=${id}`;
        copiarAlPortapapeles(link);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        if (confirm("¿Estás seguro de que deseas eliminar esta reserva?")) {
          borrarReserva(id, this);
        }
      });
    });
  } catch (error) {
    if (error.message !== "No autorizado") {
      msg.textContent = "Error de conexión.";
      msg.className = "text-danger";
    }
  }
});

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

function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(texto)
      .then(() => alert("Enlace copiado al portapapeles: " + texto))
      .catch((err) => alert("Error al copiar el enlace: " + err));
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      alert("Enlace copiado al portapapeles: " + texto);
    } catch {
      alert("Error al copiar el enlace");
    }
    document.body.removeChild(textArea);
  }
}

async function borrarReserva(id, btn) {
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Borrando...";

  try {
    const response = await authFetch(API_BASE + `/api/usuario/${id}`, { method: "DELETE" });
    if (response.ok) {
      alert("Reserva eliminada exitosamente.");
      location.reload();
    } else {
      const data = await response.json();
      alert(data.error || "Error al eliminar la reserva.");
      btn.disabled = false;
      btn.textContent = originalText;
    }
  } catch (error) {
    if (error.message !== "No autorizado") {
      alert("Error al conectar con el servidor.");
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}
