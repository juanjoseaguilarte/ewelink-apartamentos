// edit.js
checkAuth();

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");
  const msg = document.getElementById("msg");

  if (!userId) {
    msg.textContent = "No se proporcionó un ID de reserva.";
    return;
  }

  try {
    const response = await authFetch(API_BASE + `/api/usuario/${userId}`);
    if (response.ok) {
      const reserva = await response.json();
      document.getElementById("nombre").value = reserva.nombre || "";
      document.getElementById("apellido").value = reserva.apellido || "";
      document.getElementById("fecha_entrada").value = reserva.fecha_entrada || "";
      document.getElementById("fecha_salida").value = reserva.fecha_salida || "";
      document.getElementById("hora_entrada").value = reserva.hora_entrada || "";
      document.getElementById("hora_salida").value = reserva.hora_salida || "";
      document.getElementById("intentos").value = reserva.intentos || "";
      document.getElementById("pin").value = reserva.pin || "";
    } else {
      const data = await response.json();
      msg.textContent = data.error || "Reserva no encontrada.";
      msg.className = "text-danger";
    }
  } catch (error) {
    if (error.message !== "No autorizado") {
      msg.textContent = "Error al conectar con el servidor.";
      msg.className = "text-danger";
    }
  }

  document.getElementById("editForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const btn = document.querySelector("#editForm button[type='submit']");
    const originalText = btn.textContent;

    const updatedReserva = {
      nombre: document.getElementById("nombre").value,
      apellido: document.getElementById("apellido").value,
      fecha_entrada: document.getElementById("fecha_entrada").value,
      fecha_salida: document.getElementById("fecha_salida").value,
      hora_entrada: document.getElementById("hora_entrada").value,
      hora_salida: document.getElementById("hora_salida").value,
      intentos: document.getElementById("intentos").value,
      pin: document.getElementById("pin").value,
    };

    btn.disabled = true;
    btn.textContent = "Guardando...";
    msg.textContent = "";

    try {
      const updateResponse = await authFetch(API_BASE + `/api/usuario/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updatedReserva),
      });

      const data = await updateResponse.json();

      if (updateResponse.ok) {
        msg.textContent = "Reserva actualizada exitosamente.";
        msg.className = "text-success";
      } else {
        msg.textContent = data.error || "Error al actualizar la reserva.";
        msg.className = "text-danger";
      }
    } catch (error) {
      if (error.message !== "No autorizado") {
        msg.textContent = "Error al conectar con el servidor.";
        msg.className = "text-danger";
      }
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});
