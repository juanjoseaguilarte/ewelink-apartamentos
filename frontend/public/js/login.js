document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("adminToken")) {
    window.location.href = "/sdklds9dkdjsksdksdj.html";
    return;
  }

  document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const btn = document.getElementById("submitBtn");
    const msg = document.getElementById("msg");

    btn.disabled = true;
    btn.textContent = "Iniciando sesión...";
    msg.textContent = "";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("adminToken", data.token);
        window.location.href = "/sdklds9dkdjsksdksdj.html";
      } else {
        msg.textContent = data.error || "Error al iniciar sesión";
        msg.className = "text-danger";
      }
    } catch {
      msg.textContent = "Error de conexión";
      msg.className = "text-danger";
    } finally {
      btn.disabled = false;
      btn.textContent = "Iniciar Sesión";
    }
  });
});
