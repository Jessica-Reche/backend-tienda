# imagen base
FROM node:14

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el package.json y el package-lock.json al contenedor
COPY package*.json ./

# Instalamos las dependencias de la aplicación
RUN npm install

# Copiamos la carpeta backend-tienda-master
COPY . /app/



# Exponemos el puerto 4000
EXPOSE 4000

# Ejecutamos la aplicación
CMD [ "npm", "start" ]
