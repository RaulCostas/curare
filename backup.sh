#!/bin/bash

# Script de Backup de Base de Datos PostgreSQL
# Uso: ./backup.sh

# Configuración
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="curare-postgres"
DB_NAME="curare_production"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Realizar backup
echo "Iniciando backup de base de datos..."
docker exec $CONTAINER_NAME pg_dump -U curare_user $DB_NAME > $BACKUP_FILE

# Comprimir backup
gzip $BACKUP_FILE
echo "Backup completado: ${BACKUP_FILE}.gz"

# Eliminar backups antiguos (mantener últimos 30 días)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
echo "Backups antiguos eliminados"

echo "Proceso de backup finalizado exitosamente"
