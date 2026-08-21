---
name: compilar-backend
description: >-
  Utiliza este skill cuando el usuario te pida "compilar el backend", "preparar el backend para producción" o "correr el proceso de build del servidor".
---

# Procedimiento para Compilar el Backend

Sigue estrictamente estos pasos en orden cuando se te pida compilar el backend:

1. **Limpieza:** Ejecuta el comando `npm run clean` (o elimina manualmente la carpeta `dist/` si no existe el comando) en la carpeta `centro-dental-aa-backend-main`.
2. **Instalación:** Ejecuta `npm install` en la misma carpeta para asegurarte de que todas las dependencias estén al día.
3. **Tests:** Ejecuta `npm run test` (si existen pruebas configuradas). Si algún test falla, detente inmediatamente, avisa al usuario y no continúes.
4. **Build:** Si los tests pasan o no hay tests, ejecuta `npm run build`.
5. **Reporte:** Al finalizar, muéstrale al usuario un resumen indicando que el proceso fue exitoso.
