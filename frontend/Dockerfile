# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

RUN npm install

# Copiar el código fuente
COPY . .

EXPOSE 5173

# En Vite se requiere indicar el flag --host para que escuche conexiones desde el contenedor
CMD ["npm", "run", "dev", "--", "--host"]