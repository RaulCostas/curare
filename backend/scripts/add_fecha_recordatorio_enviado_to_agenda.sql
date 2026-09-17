-- Agregar campo para rastrear la fecha y hora del envío de recordatorios de citas
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS fecha_recordatorio_enviado TIMESTAMP NULL;
