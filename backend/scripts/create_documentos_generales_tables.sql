-- ==============================================================================
-- MIGRACIÓN / SCRIPT DE PRODUCCIÓN: Tablas documentos_generales y paciente_documentos
-- Sistema: SOFT-MEDIC / CURARE
-- Descripción:
--   1. Crea la tabla 'documentos_generales' para almacenar las plantillas Word de la clínica.
--   2. Crea la tabla 'paciente_documentos' para almacenar los documentos archivados en el expediente de cada paciente.
--   3. Crea índices para optimización de consultas y ordenamiento.
--   4. Configura triggers para actualizar automáticamente el campo 'updated_at'.
--   5. Totalmente idempotente (seguro de ejecutar múltiples veces sin error).
-- ==============================================================================

BEGIN;

-- 1. Crear tabla de Documentos Generales (Plantillas Word de la Clínica)
CREATE TABLE IF NOT EXISTS "documentos_generales" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "archivo" VARCHAR(255) NOT NULL,
    "archivo_original" VARCHAR(255) NOT NULL,
    "tamano" BIGINT,
    "mimetype" VARCHAR(100),
    "estado" VARCHAR(50) DEFAULT 'activo',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas y filtros en documentos_generales
CREATE INDEX IF NOT EXISTS "idx_doc_generales_estado" ON "documentos_generales"("estado");
CREATE INDEX IF NOT EXISTS "idx_doc_generales_nombre" ON "documentos_generales"("nombre");


-- 2. Crear tabla de Documentos del Paciente (Expediente Digital)
CREATE TABLE IF NOT EXISTS "paciente_documentos" (
    "id" SERIAL PRIMARY KEY,
    "paciente_id" INTEGER NOT NULL REFERENCES "pacientes"("id") ON DELETE CASCADE,
    "documento_general_id" INTEGER REFERENCES "documentos_generales"("id") ON DELETE SET NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "archivo" VARCHAR(255) NOT NULL,
    "archivo_original" VARCHAR(255) NOT NULL,
    "tamano" BIGINT,
    "mimetype" VARCHAR(100),
    "fecha" DATE DEFAULT CURRENT_DATE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas y filtros en paciente_documentos
CREATE INDEX IF NOT EXISTS "idx_paciente_doc_paciente_id" ON "paciente_documentos"("paciente_id");
CREATE INDEX IF NOT EXISTS "idx_paciente_doc_doc_general_id" ON "paciente_documentos"("documento_general_id");
CREATE INDEX IF NOT EXISTS "idx_paciente_doc_fecha" ON "paciente_documentos"("fecha");


-- 3. Verificaciones de columnas por si la tabla ya existía parcialmente
DO $$ 
BEGIN
    -- Columnas en documentos_generales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos_generales' AND column_name = 'estado') THEN
        ALTER TABLE "documentos_generales" ADD COLUMN "estado" VARCHAR(50) DEFAULT 'activo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos_generales' AND column_name = 'tamano') THEN
        ALTER TABLE "documentos_generales" ADD COLUMN "tamano" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos_generales' AND column_name = 'mimetype') THEN
        ALTER TABLE "documentos_generales" ADD COLUMN "mimetype" VARCHAR(100);
    END IF;

    -- Columnas en paciente_documentos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paciente_documentos' AND column_name = 'documento_general_id') THEN
        ALTER TABLE "paciente_documentos" ADD COLUMN "documento_general_id" INTEGER REFERENCES "documentos_generales"("id") ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paciente_documentos' AND column_name = 'tamano') THEN
        ALTER TABLE "paciente_documentos" ADD COLUMN "tamano" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paciente_documentos' AND column_name = 'mimetype') THEN
        ALTER TABLE "paciente_documentos" ADD COLUMN "mimetype" VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paciente_documentos' AND column_name = 'fecha') THEN
        ALTER TABLE "paciente_documentos" ADD COLUMN "fecha" DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;


-- 4. Funciones y Triggers para actualización automática de updated_at
CREATE OR REPLACE FUNCTION update_documentos_generales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documentos_generales_updated_at ON "documentos_generales";
CREATE TRIGGER trg_documentos_generales_updated_at
BEFORE UPDATE ON "documentos_generales"
FOR EACH ROW
EXECUTE FUNCTION update_documentos_generales_updated_at();

CREATE OR REPLACE FUNCTION update_paciente_documentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paciente_documentos_updated_at ON "paciente_documentos";
CREATE TRIGGER trg_paciente_documentos_updated_at
BEFORE UPDATE ON "paciente_documentos"
FOR EACH ROW
EXECUTE FUNCTION update_paciente_documentos_updated_at();

COMMIT;
