const fs = require('fs');
let content = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

// 1. Fix placeholders that were missed
content = content.replace(/placeholder="Paterno\.\.\."/g, 'placeholder="Ej: Pérez"');
content = content.replace(/placeholder="Materno\.\.\."/g, 'placeholder="Ej: Mamani"');
content = content.replace(/placeholder="Nombre\.\.\."/g, 'placeholder="Ej: Carlos"');
content = content.replace(/placeholder="Dirección completa\.\.\."/g, 'placeholder="Ej: Av. 6 de Agosto #123"');
content = content.replace(/placeholder="Número"/g, 'placeholder="Ej: 71234567"');

// 2. Fix Ficha Medica inputs not stretching
// They have `flex-1 pl-9` instead of `w-full pl-9` inside the input class.
// We should replace `flex-1 pl-9` with `w-full pl-9` for all inputs and textareas.
const lines = content.split('\n');
const newLines = lines.map(line => {
    if (line.includes('<input ') || line.includes('<textarea ')) {
        // Change flex-1 to w-full inside the className of the input
        return line.replace(/className="flex-1\b/, 'className="w-full');
    }
    return line;
});

content = newLines.join('\n');

fs.writeFileSync('src/components/PacienteCreateView.tsx', content);
