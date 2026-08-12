# Etapa 1: Construcción del Frontend React (Build)
FROM node:20-alpine AS build

WORKDIR /app

# Copiar manifiestos de dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar todo el código fuente del frontend y compilar
COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx para producción
FROM nginx:alpine

# Limpiar directorio HTML por defecto
RUN rm -rf /usr/share/nginx/html/*

# Copiar artefactos compilados desde la etapa build
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
