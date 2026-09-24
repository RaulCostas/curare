import type { Arancel } from '../types';

export interface ParsedVoicePresupuestoItem {
    arancel: Arancel;
    piezas: string;
    cantidad: number;
    descuento: number;
    posible: boolean;
    precioType: 'precio1' | 'precio2';
    precioUnitario: number;
    subTotal: number;
    total: number;
    confidence: number;
    originalTranscript: string;
}

// Normalizar texto: minúsculas, sin tildes ni caracteres especiales
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[,;.:]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Reemplazar números en palabras a dígitos en español
const NUMBER_WORDS: { [key: string]: number } = {
    'cero': 0, 'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
    'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
    'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
    'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
    'veinte': 20, 'veintiuno': 21, 'veintidos': 22, 'veintitres': 23, 'veinticuatro': 24,
    'veinticinco': 25, 'veintiseis': 26, 'veintisiete': 27, 'veintiocho': 28,
    'treinta': 30, 'treinta y uno': 31, 'treinta y dos': 32, 'treinta y tres': 33,
    'treinta y cuatro': 34, 'treinta y cinco': 35, 'treinta y seis': 36, 'treinta y siete': 37, 'treinta y ocho': 38,
    'cuarenta': 40, 'cuarenta y uno': 41, 'cuarenta y dos': 42, 'cuarenta y tres': 43,
    'cuarenta y cuatro': 44, 'cuarenta y cinco': 45, 'cuarenta y seis': 46, 'cuarenta y siete': 47, 'cuarenta y ocho': 48
};

// Sinónimos odontológicos comunes
const DENTAL_SYNONYMS: { [key: string]: string[] } = {
    'curacion': ['obturacion', 'resina', 'restauracion'],
    'curaciones': ['obturacion', 'resina', 'restauracion'],
    'empaste': ['obturacion', 'resina'],
    'tapadura': ['obturacion', 'resina'],
    'limpieza': ['profilaxis', 'destartraje', 'tartectomia', 'limpieza'],
    'sarro': ['profilaxis', 'destartraje', 'tartectomia'],
    'extraccion': ['exodoncia', 'extraccion'],
    'sacar': ['exodoncia', 'extraccion'],
    'sacar muela': ['exodoncia', 'extraccion'],
    'conducto': ['endodoncia', 'conducto'],
    'nervio': ['endodoncia', 'conducto', 'pulpectomia'],
    'funda': ['corona', 'protesis fija'],
    'postizo': ['protesis', 'placa'],
    'placa': ['protesis', 'radiografia', 'placa'],
    'tornillo': ['implante', 'perno'],
    'blanqueado': ['blanqueamiento'],
    'frenillos': ['ortodoncia', 'brackets'],
    'placa panoramica': ['panoramica', 'radiografia']
};

export function parsePresupuestoVoice(rawText: string, aranceles: Arancel[]): ParsedVoicePresupuestoItem | null {
    if (!rawText || !rawText.trim() || !aranceles.length) return null;

    let text = normalizeText(rawText);

    // 1. Detectar comando "posible"
    let posible = false;
    const posibleRegex = /\b(posible|posibles|tratamiento posible|posiblemente|como posible)\b/gi;
    if (posibleRegex.test(text)) {
        posible = true;
        text = text.replace(posibleRegex, ' ').trim();
    }

    // 2. Detectar "precio 1" o "precio 2"
    let precioType: 'precio1' | 'precio2' = 'precio1';
    if (/\b(precio 2|precio dos|tarifa 2|tarifa dos|segundo precio)\b/i.test(text)) {
        precioType = 'precio2';
        text = text.replace(/\b(precio 2|precio dos|tarifa 2|tarifa dos|segundo precio)\b/gi, ' ').trim();
    } else if (/\b(precio 1|precio uno|tarifa 1|tarifa uno|primer precio)\b/i.test(text)) {
        precioType = 'precio1';
        text = text.replace(/\b(precio 1|precio uno|tarifa 1|tarifa uno|primer precio)\b/gi, ' ').trim();
    }

    // 3. Detectar descuento (ej: "con 10% de descuento", "descuento de 20%", "15 por ciento de descuento", "descuento 10")
    let descuento = 0;
    const descMatch1 = text.match(/\b(?:descuento|desc|descuento de|con descuento de|con desc de)\s+(\d+(?:[.,]\d+)?)\s*(?:%|por ciento)?\b/i);
    const descMatch2 = text.match(/\b(\d+(?:[.,]\d+)?)\s*(?:%|por ciento)\s*(?:de\s+descuento|de\s+desc)?\b/i);
    if (descMatch1) {
        descuento = parseFloat(descMatch1[1].replace(',', '.'));
        text = text.replace(descMatch1[0], ' ').trim();
    } else if (descMatch2) {
        descuento = parseFloat(descMatch2[1].replace(',', '.'));
        text = text.replace(descMatch2[0], ' ').trim();
    }

    // 4. Detectar cantidad explícita (ej: "cantidad 2", "3 unidades", "dos tratamientos")
    let explicitCantidad: number | null = null;
    const cantMatch = text.match(/\b(?:cantidad|cant|unidades|unidad|veces|numero de piezas|cantidad de)\s+(\d+|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/i);
    if (cantMatch) {
        const cantVal = cantMatch[1].toLowerCase();
        explicitCantidad = NUMBER_WORDS[cantVal] !== undefined ? NUMBER_WORDS[cantVal] : parseInt(cantVal, 10);
        text = text.replace(cantMatch[0], ' ').trim();
    }

    // 5. Detectar Piezas Dentales
    // Corregir transcripciones fonéticas habituales (ej: "empieza 24" -> "en pieza 24", pero cuidando "limpieza")
    text = text.replace(/(?<!l)empieza\s*([0-9])/gi, 'en pieza $1');
    text = text.replace(/\benpieza\s*([0-9])/gi, 'en pieza $1');

    // Notación odontológica habitual: números del 11 al 48, 51 al 85, o listas ej: "11, 12, 13", "14 y 15", "pieza 26", "diente 3.6"
    const detectedPieces: string[] = [];

    // Reemplazar patrones de "pieza 1.4" a "pieza 14"
    text = text.replace(/pieza\s*(\d)\s*[.]\s*(\d)/gi, 'pieza $1$2');
    text = text.replace(/diente\s*(\d)\s*[.]\s*(\d)/gi, 'diente $1$2');

    // Buscar bloque de piezas: "pieza(s) 14, 15 y 16" o "en la 14, 15"
    const piezasPrefixMatch = text.match(/\b(?:en la|en las|en el|en los|en pieza|en piezas|pieza|piezas|diente|dientes|elemento|elementos)\s+([0-9\s,yyea.-]+)/i);
    if (piezasPrefixMatch) {
        const pieceChunk = piezasPrefixMatch[1];
        // Extraer todos los números de 1 o 2 dígitos en el bloque
        const matches = pieceChunk.match(/\b([1-8][1-8]|[1-8][1-5]|[1-9]|10|11|12|13|14|15|16|17|18|21|22|23|24|25|26|27|28|31|32|33|34|35|36|37|38|41|42|43|44|45|46|47|48)\b/g);
        if (matches && matches.length > 0) {
            matches.forEach(p => {
                if (!detectedPieces.includes(p)) detectedPieces.push(p);
            });
            text = text.replace(piezasPrefixMatch[0], ' ').trim();
        }
    }

    // Si aún hay números de piezas típicos dentales (11-48) sueltos cerca del final:
    const isolatedPieceMatches = text.match(/\b([1-4][1-8]|[5-8][1-5])\b/g);
    if (isolatedPieceMatches) {
        isolatedPieceMatches.forEach(p => {
            if (!detectedPieces.includes(p)) detectedPieces.push(p);
            text = text.replace(new RegExp(`\\b${p}\\b`, 'g'), ' ').trim();
        });
    }

    const piezasStr = detectedPieces.join(', ');
    const cantidad = explicitCantidad !== null && explicitCantidad > 0 
        ? explicitCantidad 
        : (detectedPieces.length > 0 ? detectedPieces.length : 1);

    // 6. Buscar el mejor Arancel correspondiente
    // Limpiar palabras vacías o conectores en español
    const stopWords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'con', 'para', 'por', 'en', 'al', 'y', 'o', 'e', 'a', 'sobre', 'que', 'se', 'le', 'lo']);
    
    // Expandir sinónimos en la consulta
    let expandedWords: string[] = [];
    const rawWords = text.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
    
    rawWords.forEach(w => {
        expandedWords.push(w);
        if (DENTAL_SYNONYMS[w]) {
            expandedWords.push(...DENTAL_SYNONYMS[w]);
        }
    });

    let bestArancel: Arancel | null = null;
    let highestScore = 0;

    for (const arancel of aranceles) {
        const arancelNorm = normalizeText(arancel.detalle);
        const arancelWords = arancelNorm.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

        let score = 0;

        // Coincidencia exacta de frase
        if (arancelNorm === text) {
            score += 100;
        } else if (arancelNorm.includes(text) || text.includes(arancelNorm)) {
            score += 60;
        }

        // Coincidencia por palabras
        let matchedWordsCount = 0;
        for (const word of rawWords) {
            if (arancelNorm.includes(word)) {
                matchedWordsCount++;
                score += 15;
            } else if (DENTAL_SYNONYMS[word] && DENTAL_SYNONYMS[word].some(syn => arancelNorm.includes(syn))) {
                matchedWordsCount++;
                score += 12;
            }
        }

        // Si todas las palabras importantes de la consulta están en el arancel
        if (rawWords.length > 0 && matchedWordsCount === rawWords.length) {
            score += 25;
        }

        // Penalizar si el arancel es muy largo y solo coincide una palabra poco específica
        const coverageRatio = matchedWordsCount / Math.max(arancelWords.length, 1);
        score += coverageRatio * 20;

        if (score > highestScore) {
            highestScore = score;
            bestArancel = arancel;
        }
    }

    // Umbral mínimo de coincidencia
    if (!bestArancel || highestScore < 10) {
        return null;
    }

    const precioUnitario = precioType === 'precio1' 
        ? Number(bestArancel.precio1 || 0) 
        : Number(bestArancel.precio2 || 0);

    const subTotal = precioUnitario * cantidad;
    const descAmount = (subTotal * (descuento || 0)) / 100;
    const total = subTotal - descAmount;

    return {
        arancel: bestArancel,
        piezas: piezasStr,
        cantidad,
        descuento: isNaN(descuento) ? 0 : descuento,
        posible,
        precioType,
        precioUnitario,
        subTotal,
        total,
        confidence: Math.min(100, Math.round(highestScore)),
        originalTranscript: rawText
    };
}
