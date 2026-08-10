const fs = require('fs');
let content = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

// 1. Update placeholders
content = content.replace(/placeholder="Nombres..."/g, 'placeholder="Ej: Carlos"');
content = content.replace(/placeholder="Ape paterno..."/g, 'placeholder="Ej: Pérez"');
content = content.replace(/placeholder="Ape materno..."/g, 'placeholder="Ej: Mamani"');
content = content.replace(/placeholder="Nro documento..."/g, 'placeholder="Ej: 1234567"');
content = content.replace(/placeholder="Direccion..."/g, 'placeholder="Ej: Av. 6 de Agosto #123"');
content = content.replace(/placeholder="Lugar expedicion..."/g, 'placeholder="Ej: LP"');
content = content.replace(/placeholder="Telefono..."/g, 'placeholder="Ej: 2223344"');
content = content.replace(/placeholder="Celular..."/g, 'placeholder="Ej: 71234567"');
content = content.replace(/placeholder="Casilla..."/g, 'placeholder="Ej: 1234"');
content = content.replace(/placeholder="Email..."/g, 'placeholder="Ej: correo@ejemplo.com"');
content = content.replace(/placeholder="Profesion..."/g, 'placeholder="Ej: Ingeniero"');
content = content.replace(/placeholder="Direccion oficina..."/g, 'placeholder="Ej: Edificio Empresarial, Piso 3"');
content = content.replace(/placeholder="Telefono oficina..."/g, 'placeholder="Ej: 2112233"');
content = content.replace(/placeholder="Fax..."/g, 'placeholder="Ej: 2112234"');
content = content.replace(/placeholder="Casilla postal..."/g, 'placeholder="Ej: 4321"');
content = content.replace(/placeholder="Seguro medico..."/g, 'placeholder="Ej: Caja Petrolera"');
content = content.replace(/placeholder="Poliza..."/g, 'placeholder="Ej: POL-987654"');
content = content.replace(/placeholder="Recomendado..."/g, 'placeholder="Ej: Dr. López"');
content = content.replace(/placeholder="Responsable..."/g, 'placeholder="Ej: Juan Pérez"');
content = content.replace(/placeholder="Parentesco..."/g, 'placeholder="Ej: Padre"');
content = content.replace(/placeholder="Direccion responsable..."/g, 'placeholder="Ej: Av. Arce"');
content = content.replace(/placeholder="Telefono responsable..."/g, 'placeholder="Ej: 71122333"');
content = content.replace(/placeholder="Nomenclatura..."/g, 'placeholder="Ej: 12-A"');
content = content.replace(/placeholder="Observaciones..."/g, 'placeholder="Ej: Paciente presenta dolor al masticar..."');
content = content.replace(/placeholder="Medico cabecera..."/g, 'placeholder="Ej: Dr. Fernández"');
content = content.replace(/placeholder="Enfermedad actual..."/g, 'placeholder="Ej: Ninguna"');
content = content.replace(/placeholder="Medicamentos detalle..."/g, 'placeholder="Ej: Paracetamol 500mg"');
content = content.replace(/placeholder="Tratamiento..."/g, 'placeholder="Ej: Ortodoncia"');
content = content.replace(/placeholder="Causa mal aliento..."/g, 'placeholder="Ej: Placa bacteriana"');
content = content.replace(/placeholder="Comentarios..."/g, 'placeholder="Ej: Ninguno"');

// 2. Standardize Ficha Medica inputs styles
// The original input class in Datos Paciente: 
// className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
// However, since we wrapped them in relative with an icon, we changed px-4 to pl-9 pr-3.
// But Ficha Medica inputs originally had: "flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
// Then we applied the add_icons script which changed px-2 to pl-9 pr-3.
// We need to replace: py-1 -> py-2, rounded -> rounded-lg, focus:border-blue-500 -> focus:ring-2 focus:ring-blue-500
// Also add text-gray-900 dark:text-white

const lines = content.split('\n');
const newLines = lines.map(line => {
    // Check if line contains Ficha Medica input classes
    if (line.includes('<input ') || line.includes('<textarea ')) {
        let newLine = line;
        
        // Upgrade py-1 to py-2
        newLine = newLine.replace(/py-1\b/, 'py-2');
        
        // Upgrade rounded to rounded-lg (if not already rounded-lg)
        if (newLine.includes('rounded ') || newLine.includes('rounded"')) {
            newLine = newLine.replace(/rounded\b/g, 'rounded-lg');
        }

        // Upgrade focus:border-blue-500 to focus:ring-2 focus:ring-blue-500
        newLine = newLine.replace(/focus:border-blue-500/, 'focus:ring-2 focus:ring-blue-500');

        // Add text colors if missing
        if (!newLine.includes('text-gray-900')) {
            newLine = newLine.replace('bg-white', 'bg-white text-gray-900');
        }
        if (!newLine.includes('dark:text-white')) {
            newLine = newLine.replace('dark:bg-gray-700', 'dark:bg-gray-700 dark:text-white');
        }

        return newLine;
    }
    return line;
});

content = newLines.join('\n');

// Make sure the inputs are wrapped in flex-1 or w-full.
// The left labels were "text-sm font-medium shrink-0", but they were flex row. Let's make them flex-col so the inputs can be 100% width, just like the image!
// In the user's latest message, they want it to stretch to the border.
// Let's modify the Ficha Medica rows to stack the label and input, just like the normal fields.
content = content.replace(/className="flex gap-2 items-start"/g, 'className="flex flex-col gap-1 items-start"');
content = content.replace(/className="flex gap-2 items-center"/g, 'className="flex flex-col gap-1 items-start"');
content = content.replace(/className="flex gap-4 items-center"/g, 'className="flex flex-col gap-1 items-start"');

fs.writeFileSync('src/components/PacienteCreateView.tsx', content);
