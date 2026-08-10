const fs = require('fs');
let content = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

const iconsMap = {
    'nombres': 'User',
    'ape_paterno': 'User',
    'ape_materno': 'User',
    'nro_documento': 'FileText',
    'lugar_expedicion': 'MapPin',
    'direccion': 'MapPin',
    'telefono': 'Phone',
    'casilla': 'Clipboard',
    'email': 'Mail',
    'profesion': 'Briefcase',
    'direccion_oficina': 'MapPin',
    'telefono_oficina': 'Phone',
    'fax': 'Phone',
    'casilla_postal': 'Clipboard',
    'fecha_nacimiento': 'Calendar',
    'seguro_medico': 'Shield',
    'poliza': 'FileText',
    'recomendado': 'User',
    'responsable': 'User',
    'parentesco': 'User',
    'direccion_responsable': 'MapPin',
    'telefono_responsable': 'Phone',
    'nomenclatura': 'FileText',
    'fichaMedica.observaciones': 'Activity',
    'fichaMedica.medico_cabecera': 'User',
    'fichaMedica.enfermedad_actual': 'Activity',
    'fichaMedica.medicamentos_detalle': 'Activity',
    'fichaMedica.tratamiento': 'Activity',
    'fichaMedica.causa_mal_aliento': 'Activity',
    'fichaMedica.comentarios': 'Clipboard'
};

const importsToAdd = `import { User, Phone, MapPin, Mail, Briefcase, Calendar, Shield, Activity, FileText, Clipboard } from 'lucide-react';\n`;
if (!content.includes('import { User, Phone')) {
    content = content.replace(/import .*?from 'react';/, match => match + '\n' + importsToAdd);
}

// Helper to replace inputs
function processLine(line) {
    if (!line.includes('<input ') && !line.includes('<textarea ')) return line;
    if (line.includes('type="radio"') || line.includes('type="checkbox"')) return line;
    
    if (line.includes('relative')) return line;

    const nameMatch = line.match(/name="([^"]+)"/);
    if (!nameMatch) return line;

    const name = nameMatch[1];
    let icon = iconsMap[name] || 'FileText';

    if (line.includes('readOnly') && line.includes('calculateAge')) {
        icon = 'Calendar';
    }

    let newLine = line.replace(/px-4|px-3|px-2/g, 'pl-9 pr-3');

    if (!newLine.includes('placeholder=')) {
        let desc = name.replace('fichaMedica.', '').replace(/_/g, ' ');
        desc = desc.charAt(0).toUpperCase() + desc.slice(1) + '...';
        newLine = newLine.replace('className=', 'placeholder="' + desc + '" className=');
    }

    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    return indent + '<div className="relative flex-1 w-full">\n' +
           indent + '    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">\n' +
           indent + '        <' + icon + ' className="h-4 w-4" />\n' +
           indent + '    </div>\n' +
           indent + '    ' + newLine.trim() + '\n' +
           indent + '</div>';
}

const lines = content.split('\n');
const newLines = lines.map(processLine);
fs.writeFileSync('src/components/PacienteCreateView.tsx', newLines.join('\n'));
