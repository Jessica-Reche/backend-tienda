# imagen compatible con bycript
FROM node:14

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el package.json y el package-lock.json al contenedor
COPY package*.json ./

# Instalamos las dependencias de la aplicación
RUN npm install

# Copiamos el resto de los archivos al contenedor
COPY . .

# Exponemos el puerto 4000
EXPOSE 4000

# Ejecutamos la aplicación
CMD [ "npm", "start" ]
