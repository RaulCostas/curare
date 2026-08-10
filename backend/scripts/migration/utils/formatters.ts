export function cleanAccessId(idStr: any): { numericId: number; originalId: string } | null {
  if (!idStr) return null;
  const str = idStr.toString().trim();
  const originalId = str;
  const cleaned = str.replace(/^P-/i, '');
  const numericId = parseInt(cleaned, 10);
  if (isNaN(numericId)) {
    return null;
  }
  return { numericId, originalId };
}

export function cleanString(val: any, defaultVal: string = ''): string {
  if (val === null || val === undefined) return defaultVal;
  const str = val.toString().trim();
  return str.length > 0 ? str : defaultVal;
}

export function cleanCelular(val: any): string {
  if (val === null || val === undefined) return '';
  const str = val.toString().trim();
  if (!str || str === '-' || str === '.') return '';
  if (str.startsWith('+')) return str;
  if (str.startsWith('591')) return `+${str}`;
  return `+591${str}`;
}

export function cleanDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    const str = val.trim();
    if (!str || str === '.' || str === '0') return null;
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (match) {
      let day = parseInt(match[1], 10);
      let month = parseInt(match[2], 10);
      let year = parseInt(match[3], 10);
      if (year < 100) {
        year += year > 50 ? 1900 : 2000;
      }
      if (year < 1900 || year > 2100) return null;
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      const testD = new Date(year, month - 1, day);
      if (testD.getFullYear() !== year || testD.getMonth() !== month - 1 || testD.getDate() !== day) {
        return null;
      }
      const yyyy = year.toString().padStart(4, '0');
      const mm = month.toString().padStart(2, '0');
      const dd = day.toString().padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getUTCFullYear();
    if (yyyy < 1900 || yyyy > 2100) return null;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

export function parseBoolean(val: any): boolean {
  if (val === null || val === undefined) return false;
  const str = val.toString().trim().toUpperCase();
  return str === 'X' || str === 'SI' || str === 'S' || str === '1' || str === 'TRUE';
}

export function parseCurrency(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = val.toString().trim();
  if (!str) return 0;

  // Si tiene tanto punto como coma: ej. "12.760,00" o "1.241,00"
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } 
  // Si solo tiene coma: ej. "433,50" o "2870,00"
  else if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  } 
  // Si solo tiene punto: ej. "920.00" o "3470.00" o "1.241"
  else if (str.includes('.') && !str.includes(',')) {
    const parts = str.split('.');
    if (parts[parts.length - 1].length <= 2) {
      // Dejar el punto como separador decimal (920.00 -> 920.00)
    } else {
      // Quitar punto como separador de miles (1.241 -> 1241)
      str = str.replace(/\./g, '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}
