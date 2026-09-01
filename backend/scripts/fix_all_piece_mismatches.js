const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'postgrespg',
        database: 'curare',
    });
    await client.connect();

    console.log("=== FIXING ALL PIEZA MISMATCHES IN HISTORIA_CLINICA ===");

    const updateQuery = `
        WITH better_matches AS (
            SELECT DISTINCT ON (hc.id)
                hc.id as hc_id,
                better_pd.id as better_pd_id
            FROM historia_clinica hc
            JOIN proforma_detalle curr_pd ON curr_pd.id = hc."proformaDetalleId"
            LEFT JOIN arancel curr_a ON curr_a.id = curr_pd."arancelId"
            JOIN proforma_detalle better_pd ON better_pd."proformaId" = hc."proformaId" AND better_pd.id != curr_pd.id
            LEFT JOIN arancel better_a ON better_a.id = better_pd."arancelId"
            WHERE 
                hc.pieza IS NOT NULL AND TRIM(hc.pieza) != ''
                AND curr_pd.piezas IS NOT NULL AND TRIM(curr_pd.piezas) != ''
                -- Current PD piezas does NOT match HC pieza
                AND TRIM(curr_pd.piezas) != TRIM(hc.pieza)
                AND NOT (TRIM(curr_pd.piezas) ILIKE '%' || TRIM(hc.pieza) || '%')
                -- Better PD piezas DOES match HC pieza
                AND (TRIM(better_pd.piezas) = TRIM(hc.pieza) OR TRIM(better_pd.piezas) ILIKE '%' || TRIM(hc.pieza) || '%')
                -- Better PD arancel matches or shares code/treatment
                AND (
                    better_pd."arancelId" = curr_pd."arancelId" 
                    OR (better_a.detalle IS NOT NULL AND curr_a.detalle IS NOT NULL AND LOWER(SPLIT_PART(TRIM(better_a.detalle), ' ', 1)) = LOWER(SPLIT_PART(TRIM(curr_a.detalle), ' ', 1)))
                )
            ORDER BY hc.id, 
                     CASE WHEN TRIM(better_pd.piezas) = TRIM(hc.pieza) THEN 1 ELSE 2 END,
                     better_pd.id
        )
        UPDATE historia_clinica hc
        SET "proformaDetalleId" = bm.better_pd_id
        FROM better_matches bm
        WHERE hc.id = bm.hc_id;
    `;

    const res = await client.query(updateQuery);
    console.log(`Updated ${res.rowCount} records in historia_clinica with accurate proformaDetalleId by piece matching!`);

    await client.end();
}

main().catch(console.error);
