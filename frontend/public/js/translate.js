document.getElementById('translateButton').addEventListener('click', function () {
    const translateButton = document.getElementById('translateButton');
    const isEnglish = translateButton.textContent === 'Translate to English';

    if (isEnglish) {
        // Traducir al inglés
        document.getElementById('mainTitle').textContent = 'Door Opening';
        document.getElementById('arrivalAutonomous').textContent = 'Autonomous Arrival';
        document.getElementById('noSchedules').textContent = 'No Schedules';
        document.getElementById('address').textContent = 'Address: Avenida La Banqueta 14 3-1';
        document.getElementById('googleMapsLink').textContent = 'View on Google Maps';
        document.getElementById('openDoorButton').textContent = 'Open Door';
        
        // Cambiar los textos dinámicos
        const attemptsInfo = document.getElementById('attemptsInfo');
        if (attemptsInfo.textContent.includes('intentos')) {
            attemptsInfo.textContent = attemptsInfo.textContent.replace('intentos', 'attempts');
            attemptsInfo.textContent = attemptsInfo.textContent.replace('para abrir la puerta principal', 'to open the main door');
            attemptsInfo.textContent = attemptsInfo.textContent.replace('Suba el ascensor a la tercera planta, y gire a la derecha, es la primera puerta. Se encontrará una cajita de seguridad, introduzca el código que le aparece.', 
                                                                         'Take the elevator to the third floor, turn right, it is the first door. You will find a safe box, enter the code displayed.');
        }

        // Cambiar los datos del usuario si ya se han cargado
        const userInfoDiv = document.getElementById('userInfo');
        if (userInfoDiv.innerHTML.includes('Nombre')) {
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Nombre:', 'Name:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Apellido:', 'Last Name:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Fecha de Entrada:', 'Check-in Date:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Fecha de Salida:', 'Check-out Date:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Hora de Entrada:', 'Check-in Time:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Hora de Salida:', 'Check-out Time:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Intentos Restantes:', 'Remaining Attempts:');
        }

        // Cambiar el texto del botón
        translateButton.textContent = 'Traducir al Español';
    } else {
        // Traducir al español
        document.getElementById('mainTitle').textContent = 'Apertura De Puerta';
        document.getElementById('arrivalAutonomous').textContent = 'Llegada Autónoma';
        document.getElementById('noSchedules').textContent = 'Sin Horarios';
        document.getElementById('address').textContent = 'Dirección: Avenida La Banqueta 14 3-1';
        document.getElementById('googleMapsLink').textContent = 'Ver en Google Maps';
        document.getElementById('openDoorButton').textContent = 'Abrir Puerta';

        // Cambiar los textos dinámicos
        const attemptsInfo = document.getElementById('attemptsInfo');
        if (attemptsInfo.textContent.includes('attempts')) {
            attemptsInfo.textContent = attemptsInfo.textContent.replace('attempts', 'intentos');
            attemptsInfo.textContent = attemptsInfo.textContent.replace('to open the main door', 'para abrir la puerta principal');
            attemptsInfo.textContent = attemptsInfo.textContent.replace('Take the elevator to the third floor, turn right, it is the first door. You will find a safe box, enter the code displayed.',
                                                                         'Suba el ascensor a la tercera planta, y gire a la derecha, es la primera puerta. Se encontrará una cajita de seguridad, introduzca el código que le aparece.');
        }

        // Cambiar los datos del usuario si ya se han cargado
        const userInfoDiv = document.getElementById('userInfo');
        if (userInfoDiv.innerHTML.includes('Name')) {
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Name:', 'Nombre:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Last Name:', 'Apellido:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Check-in Date:', 'Fecha de Entrada:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Check-out Date:', 'Fecha de Salida:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Check-in Time:', 'Hora de Entrada:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Check-out Time:', 'Hora de Salida:');
            userInfoDiv.innerHTML = userInfoDiv.innerHTML.replace('Remaining Attempts:', 'Intentos Restantes:');
        }

        // Cambiar el texto del botón
        translateButton.textContent = 'Translate to English';
    }
});