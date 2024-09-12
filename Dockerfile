# Usar la imagen de Node.js
FROM node:16

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el archivo package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Exponer el puerto en el que tu aplicación va a correr
EXPOSE 30010

# Comando por defecto para ejecutar la aplicación
CMD ["npm", "start"]