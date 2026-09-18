-- =========================================================
-- MIGRACION PARA CONTROL DE FELICITACIONES DE CUMPLEAÑOS
-- =========================================================

-- Agregar columna para almacenar la fecha/hora en que se envió la felicitación al paciente
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS fecha_felicitacion_cumpleanos TIMESTAMP NULL;
