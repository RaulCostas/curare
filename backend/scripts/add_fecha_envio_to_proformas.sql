-- Agregar campo para registrar la fecha y hora de envio del presupuesto
ALTER TABLE proformas ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMP NULL;
