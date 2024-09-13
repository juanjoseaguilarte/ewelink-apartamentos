# Usar la imagen base de Node.js
FROM node:16

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto del código de la aplicación al contenedor
COPY . .

# Exponer el puerto 8080
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]