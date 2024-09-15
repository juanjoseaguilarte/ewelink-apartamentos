// user-access.js
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");

    if (!userId) {
        document.getElementById("msg").textContent = "ID de usuario no proporcionado.";
        return;
    }

    const accessButton = document.getElementById("accessButton");
    accessButton.addEventListener("click", async () => {
        try {
            const response = await fetch(`http://185.253.154.145:3002/api/toggle-device?userId=${userId}`);
            const message = await response.text();

            if (response.ok) {
                document.getElementById("msg").textContent = message;
            } else {
                document.getElementById("msg").textContent = `Error: ${message}`;
            }
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
            document.getElementById("msg").textContent = "Error al conectar con el servidor.";
        }
    });
});