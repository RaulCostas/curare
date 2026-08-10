#!/bin/bash

# Script de Despliegue Automatizado
# Uso: ./deploy.sh

set -e  # Detener en caso de error

echo "🚀 Iniciando despliegue de CURARE..."

# 1. Detener contenedores existentes
echo "📦 Deteniendo contenedores..."
docker-compose down

# 2. Actualizar código desde Git (opcional)
# echo "📥 Actualizando código..."
# git pull origin main

# 3. Construir imágenes
echo "🔨 Construyendo imágenes Docker..."
docker-compose build --no-cache

# 4. Iniciar servicios
echo "▶️  Iniciando servicios..."
docker-compose up -d

# 5. Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# 6. Verificar estado
echo "✅ Verificando estado de contenedores..."
docker-compose ps

# 7. Mostrar logs
echo "📋 Mostrando logs recientes..."
docker-compose logs --tail=50

echo "✨ Despliegue completado exitosamente!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend: http://localhost:3000"
