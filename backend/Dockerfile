# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

RUN npm install

# Copiar el código fuente
COPY . .

EXPOSE 4000

# Usamos npm run dev (que ejecuta nodemon o tsx/node para desarrollo)
CMD ["npm", "run", "dev"]