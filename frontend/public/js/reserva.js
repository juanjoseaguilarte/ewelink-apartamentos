document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");
    const msgElement = document.getElementById("msg");
    const userInfoElement = document.getElementById("userInfo");
    const toggleButton = document.getElementById("toggleButton");
  
    if (!userId) {
      msgElement.textContent =
        "No se ha proporcionado un ID de usuario válido en la URL.";
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:8080/usuario/${userId}`);
  
      if (response.ok) {
        const user = await response.json();
  
        // Mostrar información del usuario
        userInfoElement.innerHTML = `
            <p><strong>Nombre:</strong> ${user.nombre}</p>
            <p><strong>Apellido:</strong> ${user.apellido}</p>
            <p><strong>Fecha de Entrada:</strong> ${user.fecha_entrada} ${user.hora_entrada}</p>
            <p><strong>Fecha de Salida:</strong> ${user.fecha_salida} ${user.hora_salida}</p>
            <p><strong>Intentos:</strong> ${user.intentos}</p>
            <p><strong>PIN Caja:</strong> ${user.pin}</p>
          `;
  
        // Comprobar si las fechas están en curso
        const today = new Date().toISOString().split("T")[0];
        const fechaEntrada = user.fecha_entrada;
        const fechaSalida = user.fecha_salida;
  
        // Habilitar botón si la fecha está en curso y tiene intentos
        if (user.intentos > 0 && today >= fechaEntrada && today <= fechaSalida) {
          toggleButton.disabled = false;
        } else {
          msgElement.textContent =
            "El usuario no está en curso o no tiene intentos disponibles";
        }
  
        // Accionar el dispositivo al hacer clic
        toggleButton.addEventListener("click", async () => {
          let message;
  
          // Crear mensaje de alerta dependiendo del número de intentos restantes
          if (user.intentos === 1) {
            message = "Te queda un solo intento, ¿deseas continuar?";
          } else {
            message = `Te queda(n) ${user.intentos - 1} intento(s), ¿quieres continuar?`;
          }
  
          // Mostrar alerta de confirmación
          const userConfirmed = confirm(message);
  
          // Si el usuario acepta, continuar
          if (userConfirmed) {
            try {
              const toggleResponse = await fetch(
                `http://localhost:8080/toggle-device?userId=${userId}`
              );
              if (toggleResponse.ok) {
                msgElement.textContent = "Dispositivo activado correctamente.";
                // Restar un intento
                user.intentos--;
                userInfoElement.querySelector(
                  "p:last-child"
                ).textContent = `Intentos: ${user.intentos}`;
                if (user.intentos <= 0) {
                  toggleButton.disabled = true;
                }
              } else {
                msgElement.textContent = "Error al activar el dispositivo";
              }
            } catch (error) {
              msgElement.textContent = "Error al conectar con el servidor";
            }
          }
        });
      } else {
        msgElement.textContent = "Usuario no encontrado";
      }
    } catch (error) {
      msgElement.textContent = "Error al conectar con el servidor";
    }
  });