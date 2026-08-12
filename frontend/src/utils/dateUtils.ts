/**
 * Formats a date string or Date object to 'DD/MM/YYYY' format.
 * If the input is null or invalid, returns '-'.
 * 
 * @param date - The date to format (string 'YYYY-MM-DD' or Date object)
 * @returns formatted date string 'DD/MM/YYYY'
 */
export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return '-';

    const d = new Date(date);
    // Check if valid date
    if (isNaN(d.getTime())) return '-';

    // Use UTC methods to avoid timezone shifts if the input is YYYY-MM-DD (UTC midnight)
    // However, if standard JS Date parsing assumes UTC for YYYY-MM-DD, 
    // displaying with getUTCDate/Month/FullYear is safer to preserve the exact date stored.

    // BUT: If the input is an ISO string with time, we might want local time.
    // Given the context of "Events" or "Transactions", standardizing on "as recorded" is best.
    // Let's stick to a simple UTC-based extraction for YYYY-MM-DD strings to avoid "Day - 1" issues.

    // If input is YYYY-MM-DD string (e.g. from Postgres date column), it parses as UTC midnight.
    // getDay() would return local day which might be previous day in Western Hemisphere.
    // So we use getUTCDate().

    // Heuristic: If string looks like a plain date, use UTC parts.
    // Heuristic: If string looks like a plain date or ISO date, use extracted parts to avoid TZ issues.
    if (typeof date === 'string') {
        const datePart = date.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = datePart.split('-').map(Number);
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        }
    }

    // For Date objects, assuming they represent a date without time (e.g. from a 'date' column),
    // we should use UTC methods because 'date' columns are usually parsed as UTC midnight.
    // If we use local methods (getDate), it will shift to previous day in Western hemisphere.
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Returns the current date in 'YYYY-MM-DD' format, adjusted for the local timezone.
 * Useful for initializing <input type="date"> values.
 */
export const getLocalDateString = (dateInput?: Date | string | null): string => {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Alias of formatDate. Formats a date using UTC methods to avoid timezone shifts.
 * Exported separately for components that import it by this name.
 */
export const formatDateUTC = formatDate;

/**
 * Formats a timestamp/date string into local timezone 'DD/MM/YYYY'.
 * If the input string has a time component (ISO timestamp with T/Z/space),
 * it converts to the browser's local timezone.
 */
export const formatDateLocal = (date: string | Date | undefined | null): string => {
    if (!date) return '-';
    
    if (typeof date === 'string') {
        const datePart = date.split(/[T ]/)[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = datePart.split('-').map(Number);
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        }
    }

    if (date instanceof Date && !isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    return formatDate(date);
};

/**
 * Formats a number with dots for thousands and comma for decimals (e.g. 1.500,00)
 */
export const formatNumberBs = (val: number | string | null | undefined): string => {
    const num = typeof val === 'string' ? parseFloat(val) : Number(val || 0);
    if (isNaN(num)) return '0,00';
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
};

/**
 * Formats a date into long Spanish string (e.g., "miércoles, 5 de agosto de 2026")
 * avoiding timezone shifts for date-only strings.
 */
export const formatLongDate = (date: string | Date | undefined | null): string => {
    if (!date) return '-';
    let year: number, month: number, day: number;
    if (typeof date === 'string') {
        const datePart = date.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
            [year, month, day] = datePart.split('-').map(Number);
        } else {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '-';
            year = d.getUTCFullYear();
            month = d.getUTCMonth() + 1;
            day = d.getUTCDate();
        }
    } else {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        year = d.getUTCFullYear();
        month = d.getUTCMonth() + 1;
        day = d.getUTCDate();
    }

    const localNoon = new Date(year, month - 1, day, 12, 0, 0);
    return localNoon.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

