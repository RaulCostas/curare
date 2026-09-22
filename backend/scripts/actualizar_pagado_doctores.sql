-- Script SQL para actualizar el estado pagado = 'SI' en historia_clinica
-- por rangos de fecha para los doctores especificados.

BEGIN;

-- 1. Doctor Avila Monica (ID = 29): desde 18/05/2010 hasta 02/12/2024
UPDATE historia_clinica
SET pagado = 'SI',
    "updatedAt" = NOW()
WHERE "doctorId" = 29
  AND fecha >= '2010-05-18'
  AND fecha <= '2024-12-02'
  AND pagado = 'NO';

-- 2. Doctor Navia Viviana (ID = 28): desde 29/10/2024 hasta 27/06/2025
UPDATE historia_clinica
SET pagado = 'SI',
    "updatedAt" = NOW()
WHERE "doctorId" = 28
  AND fecha >= '2024-10-29'
  AND fecha <= '2025-06-27'
  AND pagado = 'NO';

-- 3. Doctor Villegas Quiroga Andrea (ID = 13): desde 23/12/2013 hasta 30/06/2025
UPDATE historia_clinica
SET pagado = 'SI',
    "updatedAt" = NOW()
WHERE "doctorId" = 13
  AND fecha >= '2013-12-23'
  AND fecha <= '2025-06-30'
  AND pagado = 'NO';

COMMIT;
