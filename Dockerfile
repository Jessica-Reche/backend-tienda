# Seleccionamos la imagen base de Node.js desde Docker Hub
FROM node:14

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos el package.json y el package-lock.json al contenedor
COPY backend-tienda-master/package*.json ./

# Instalamos las dependencias de la aplicación
RUN npm install

# Copiamos el resto de los archivos al contenedor
COPY backend-tienda-master/ .

# Exponemos el puerto 4000
EXPOSE 4000

# Ejecutamos la aplicación
CMD [ "npm", "start" ]
