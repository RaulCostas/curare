import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PacientesDeudoresService {
    constructor(
        private dataSource: DataSource,
    ) { }

    async findAll(tab: 'pasivos' | 'activos' | 'traspasados' | 'observados' | string) {
        let whereClause = '';

        if (tab === 'pasivos' || tab === 'terminado') {
            whereClause = `lh."estadoPresupuesto" = 'terminado'
               AND (COALESCE(rs.realized_cost, 0) - COALESCE(ps.total_pagado, 0)) > 0
               AND (p.traspasado IS NOT TRUE)
               AND (p.deuda_observada IS NOT TRUE)`;
        } else if (tab === 'activos' || tab === 'no terminado') {
            whereClause = `lh."estadoPresupuesto" = 'no terminado'
               AND (COALESCE(rs.realized_cost, 0) - COALESCE(ps.total_pagado, 0)) > 0
               AND (p.traspasado IS NOT TRUE)
               AND (p.deuda_observada IS NOT TRUE)`;
        } else if (tab === 'traspasados') {
            whereClause = `p.traspasado IS TRUE`;
        } else if (tab === 'observados') {
            whereClause = `p.deuda_observada IS TRUE`;
        } else {
            whereClause = `1=1`;
        }

        const query = `
            WITH pagos_sum AS (
                SELECT "proformaId", 
                       COALESCE(SUM(
                           CASE 
                               WHEN LOWER(COALESCE(moneda::text, '')) LIKE '%dólar%' 
                                 OR LOWER(COALESCE(moneda::text, '')) LIKE '%dolar%' 
                                 OR LOWER(COALESCE(moneda::text, '')) LIKE '%usd%' 
                               THEN CAST(monto AS NUMERIC) * COALESCE(tc, 6.96)
                               ELSE CAST(monto AS NUMERIC)
                           END
                       ), 0) AS total_pagado
                FROM pagos
                WHERE "proformaId" IS NOT NULL
                GROUP BY "proformaId"
            ),
            pd_match_by_name AS (
                SELECT DISTINCT ON (pd."proformaId", LOWER(SPLIT_PART(TRIM(COALESCE(a.detalle, '')), ' ', 1)))
                       pd."proformaId",
                       LOWER(SPLIT_PART(TRIM(COALESCE(a.detalle, '')), ' ', 1)) AS first_word,
                       pd.id,
                       pd.total,
                       pd.cantidad
                FROM proforma_detalle pd
                LEFT JOIN arancel a ON a.id = pd."arancelId"
                WHERE pd."proformaId" IS NOT NULL
                ORDER BY pd."proformaId", LOWER(SPLIT_PART(TRIM(COALESCE(a.detalle, '')), ' ', 1)), pd.id
            ),
            dedup_historia AS (
                SELECT DISTINCT ON (
                    hc."proformaId",
                    COALESCE(hc."proformaDetalleId"::text, hc.tratamiento), 
                    COALESCE(hc.pieza, 'sin_pieza'), 
                    COALESCE(hc.cantidad, 1)
                ) 
                    hc.*
                FROM historia_clinica hc
                WHERE hc."estadoTratamiento" = 'terminado' AND hc."proformaId" IS NOT NULL
                ORDER BY 
                    hc."proformaId",
                    COALESCE(hc."proformaDetalleId"::text, hc.tratamiento), 
                    COALESCE(hc.pieza, 'sin_pieza'), 
                    COALESCE(hc.cantidad, 1),
                    hc.id ASC
            ),
            realized_sum AS (
                SELECT 
                    hc."proformaId",
                    COALESCE(SUM(
                        CASE 
                            -- Direct pd match (including pd.total = 0 for 100% discount)
                            WHEN pd.id IS NOT NULL AND CAST(pd.cantidad AS NUMERIC) > 0 
                            THEN (CAST(pd.total AS NUMERIC) / CAST(pd.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)
                            
                            -- Match by proformaId + treatment first word if proformaDetalleId is null
                            WHEN pdm.id IS NOT NULL AND CAST(pdm.cantidad AS NUMERIC) > 0
                            THEN (CAST(pdm.total AS NUMERIC) / CAST(pdm.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)

                    ELSE CAST(COALESCE(hc.precio, 0) AS NUMERIC)
                        END
                    ), 0) AS realized_cost
                FROM dedup_historia hc
                LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
                LEFT JOIN pd_match_by_name pdm ON (
                    hc."proformaDetalleId" IS NULL 
                    AND pdm."proformaId" = hc."proformaId" 
                    AND pdm.first_word = LOWER(SPLIT_PART(TRIM(COALESCE(hc.tratamiento, '')), ' ', 1))
                )
                GROUP BY hc."proformaId"
            ),
            latest_historia AS (
                SELECT 
                    hc."proformaId",
                    hc.fecha AS ultima_cita,
                    hc."especialidadId",
                    hc.tratamiento,
                    hc."estadoPresupuesto",
                    ROW_NUMBER() OVER (
                        PARTITION BY hc."proformaId" 
                        ORDER BY hc.fecha DESC, hc.id DESC
                    ) AS rn
                FROM historia_clinica hc
                WHERE hc."proformaId" IS NOT NULL
            )
            SELECT 
                p.id AS "proformaId",
                p.numero AS "numeroPresupuesto",
                p."pacienteId",
                CAST(p.total AS NUMERIC) AS "totalPresupuesto",
                CAST(COALESCE(ps.total_pagado, 0) AS NUMERIC) AS "totalPagado",
                CAST((COALESCE(rs.realized_cost, 0) - COALESCE(ps.total_pagado, 0)) AS NUMERIC) AS "saldo",
                lh.ultima_cita AS "ultimaCita",
                e.especialidad AS "especialidad",
                lh.tratamiento AS "tratamiento",
                TRIM(CONCAT_WS(' ', COALESCE(pac.paterno, ''), COALESCE(pac.materno, ''), COALESCE(pac.nombre, ''))) AS "paciente",
                lh."estadoPresupuesto" AS "status",
                p.traspasado,
                p.traspaso_observacion AS "traspasoObservacion",
                p.deuda_observada AS "deudaObservada",
                p.deuda_observada_observacion AS "deudaObservadaObservacion"
            FROM proformas p
            LEFT JOIN latest_historia lh ON lh."proformaId" = p.id AND lh.rn = 1
            LEFT JOIN pacientes pac ON pac.id = p."pacienteId"
            LEFT JOIN pagos_sum ps ON ps."proformaId" = p.id
            LEFT JOIN realized_sum rs ON rs."proformaId" = p.id
            LEFT JOIN especialidad e ON e.id = lh."especialidadId"
            WHERE ${whereClause}
            ORDER BY "saldo" DESC;
        `;

        const results = await this.dataSource.query(query);

        return results.map(r => ({
            proformaId: Number(r.proformaId),
            numeroPresupuesto: Number(r.numeroPresupuesto),
            pacienteId: Number(r.pacienteId),
            totalPresupuesto: parseFloat(r.totalPresupuesto || '0'),
            totalPagado: parseFloat(r.totalPagado || '0'),
            saldo: parseFloat(r.saldo || '0'),
            ultimaCita: r.ultimaCita,
            especialidad: r.especialidad || '',
            tratamiento: r.tratamiento || '',
            paciente: (r.paciente || '').trim().replace(/\s+/g, ' '),
            status: r.status,
            traspasado: Boolean(r.traspasado),
            traspasoObservacion: r.traspasoObservacion || '',
            deudaObservada: Boolean(r.deudaObservada),
            deudaObservadaObservacion: r.deudaObservadaObservacion || ''
        }));
    }

    async updateTraspaso(proformaId: number, traspasado: boolean, observacion?: string) {
        const updateRes = await this.dataSource.query(`
            UPDATE proformas
            SET traspasado = $1,
                traspaso_observacion = $2
            WHERE id = $3
            RETURNING id, traspasado, traspaso_observacion;
        `, [traspasado, observacion || '', proformaId]);

        if (updateRes.length === 0) {
            throw new NotFoundException(`Proforma #${proformaId} no encontrada.`);
        }

        return {
            success: true,
            proformaId,
            traspasado,
            traspasoObservacion: observacion || ''
        };
    }

    async updateDeudaObservada(proformaId: number, deudaObservada: boolean, observacion?: string) {
        const updateRes = await this.dataSource.query(`
            UPDATE proformas
            SET deuda_observada = $1,
                deuda_observada_observacion = $2
            WHERE id = $3
            RETURNING id, deuda_observada, deuda_observada_observacion;
        `, [deudaObservada, observacion || '', proformaId]);

        if (updateRes.length === 0) {
            throw new NotFoundException(`Proforma #${proformaId} no encontrada.`);
        }

        return {
            success: true,
            proformaId,
            deudaObservada,
            deudaObservadaObservacion: observacion || ''
        };
    }
}
