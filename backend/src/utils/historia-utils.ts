/**
 * Deduplica registros de historia clínica marcados como terminados.
 * Agrupa por proformaDetalleId (o tratamiento), pieza y cantidad.
 */
export const deduplicateHistoria = <T extends any>(historia: T[]): T[] => {
    if (!historia || !Array.isArray(historia)) return [];
    
    const unique: T[] = [];
    const seen = new Set<string>();
    
    for (const h of historia as any[]) {
        if (h.estadoTratamiento !== 'terminado') {
            unique.push(h);
            continue;
        }
        
        const key = `${h.proformaDetalleId || h.tratamiento}_${h.pieza || 'sin_pieza'}_${h.cantidad || 1}`;
        
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(h);
        }
    }
    
    return unique;
};
