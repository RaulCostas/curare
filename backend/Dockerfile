# Dockerfile para Backend NestJS
FROM node:18-slim AS builder

WORKDIR /app

# Instalar herramientas de compilación para módulos nativos (bcrypt, etc.)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Etapa de producción
FROM node:18-slim

WORKDIR /app

# Copiar package files, node_modules y dist desde builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main"]
