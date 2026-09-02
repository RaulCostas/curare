-- ==============================================================================
-- MIGRACIÓN / SCRIPT DE PRODUCCIÓN: Tabla estudios_complementarios
-- ==============================================================================

-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS "estudios_complementarios" (
    "id" SERIAL PRIMARY KEY,
    "pacienteId" INTEGER NOT NULL REFERENCES "pacientes"("id") ON DELETE CASCADE,
    "fecha" DATE NOT NULL,
    "tipo_estudio" VARCHAR(255) NOT NULL,
    "observaciones" TEXT,
    "orden_estudio_url" VARCHAR(500),
    "archivo_url" VARCHAR(500),
    "usuarioId" INTEGER REFERENCES "user"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índices de rendimiento para búsquedas y filtros
CREATE INDEX IF NOT EXISTS "idx_estudios_comp_paciente_id" ON "estudios_complementarios"("pacienteId");
CREATE INDEX IF NOT EXISTS "idx_estudios_comp_fecha" ON "estudios_complementarios"("fecha");
CREATE INDEX IF NOT EXISTS "idx_estudios_comp_tipo" ON "estudios_complementarios"("tipo_estudio");

-- 3. Trigger opcional para actualizar automáticamente el campo updatedAt
CREATE OR REPLACE FUNCTION update_estudios_complementarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_estudios_complementarios_updated_at ON "estudios_complementarios";
CREATE TRIGGER trg_estudios_complementarios_updated_at
BEFORE UPDATE ON "estudios_complementarios"
FOR EACH ROW
EXECUTE FUNCTION update_estudios_complementarios_updated_at();
