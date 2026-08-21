export const formatDateSpanish = (dateString: string): string => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);

    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const days = [
        'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
    ];

    const localDate = new Date(year, month - 1, day);
    const dayOfWeek = days[localDate.getDay()];

    return `La Paz ${dayOfWeek}, ${day} de ${months[month - 1]} de ${year}`;
};

export const formatDateUTC = (dateString: string): string => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
};

export const numberToWords = (amount: number): string => {
    const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const convertGroup = (n: number): string => {
        let output = '';

        if (n === 100) return 'CIEN';

        if (n >= 100) {
            output += hundreds[Math.floor(n / 100)] + ' ';
            n %= 100;
        }

        if (n >= 20) {
            output += tens[Math.floor(n / 10)];
            if (n % 10 > 0) output += ' Y ' + units[n % 10];
        } else if (n >= 10) {
            output += teens[n - 10];
        } else if (n > 0) {
            output += units[n];
        }

        return output.trim();
    };

    const integerPart = Math.floor(amount);

    if (integerPart === 0) return 'CERO';

    let words = '';

    if (integerPart >= 1000000) {
        const millions = Math.floor(integerPart / 1000000);
        words += (millions === 1 ? 'UN MILLON' : convertGroup(millions) + ' MILLONES') + ' ';
        const remainder = integerPart % 1000000;
        if (remainder > 0) {
            if (remainder >= 1000) {
                const thousands = Math.floor(remainder / 1000);
                words += (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + ' ';
                words += convertGroup(remainder % 1000);
            } else {
                words += convertGroup(remainder);
            }
        }
    } else if (integerPart >= 1000) {
        const thousands = Math.floor(integerPart / 1000);
        words += (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + ' ';
        words += convertGroup(integerPart % 1000);
    } else {
        words += convertGroup(integerPart);
    }

    return words.trim();
};

/**
 * Formatea montos numéricos utilizando '.' como separadores de miles y ',' como separadores de decimales.
 * Ejemplo: 1250.5 -> "1.250,50"
 */
export const formatCurrency = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '0,00';
    const num = typeof val === 'number' ? val : parseFloat(val.toString());
    if (isNaN(num)) return '0,00';

    return num.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const formatMonto = formatCurrency;
export const formatNumberBs = formatCurrency;
export const formatNumberUsd = formatCurrency;

export const formatFullName = (person?: { nombre?: string; paterno?: string; materno?: string } | null): string => {
    if (!person) return '';
    const parts = [person.nombre, person.paterno, person.materno].filter(Boolean);
    return parts.join(' ');
};

export const formatPaternoMaternoNombre = (person?: { nombre?: string; paterno?: string; materno?: string } | null): string => {
    if (!person) return '';
    const parts = [person.paterno, person.materno, person.nombre].filter(Boolean);
    return parts.join(' ');
};

export const isDollarCurrency = (currency?: string | null): boolean => {
    if (!currency) return false;
    const normalized = currency.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return normalized.includes('DOLAR') || normalized.includes('USD') || normalized.includes('$US');
};

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
