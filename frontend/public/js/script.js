// script.js
checkAuth();

document.getElementById("userForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const btn = document.querySelector("#userForm button[type='submit']");
  const msg = document.getElementById("msg");
  const originalText = btn.textContent;

  const user = {
    nombre: document.getElementById("nombre").value,
    apellido: document.getElementById("apellido").value,
    fecha_entrada: document.getElementById("fecha_entrada").value,
    fecha_salida: document.getElementById("fecha_salida").value,
    hora_entrada: document.getElementById("hora_entrada").value || "16:00",
    hora_salida: document.getElementById("hora_salida").value || "12:00",
    intentos: document.getElementById("intentos").value || 5,
    pin: document.getElementById("pin").value,
  };

  btn.disabled = true;
  btn.textContent = "Guardando...";
  msg.textContent = "";

  try {
    const response = await authFetch("/api/usuario", {
      method: "POST",
      body: JSON.stringify(user),
    });

    const data = await response.json();

    if (response.ok) {
      msg.textContent = "Reserva agregada exitosamente";
      msg.className = "text-success";
      document.getElementById("userForm").reset();
    } else {
      msg.textContent = data.error || "Error al agregar la reserva";
      msg.className = "text-danger";
    }
  } catch (error) {
    if (error.message !== "No autorizado") {
      msg.textContent = "Error de conexión";
      msg.className = "text-danger";
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});
