# Dockerfile para Frontend React (Pre-built)
FROM nginx:alpine

# Limpiar directorio por defecto y copiar build
RUN rm -rf /usr/share/nginx/html/*
COPY dist/ /usr/share/nginx/html/

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
