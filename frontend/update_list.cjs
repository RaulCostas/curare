const fs = require('fs');
let c = fs.readFileSync('src/components/PacienteList.tsx', 'utf-8');

if (!c.includes('<div className="flex items-center gap-3">')) {
    c = c.replace(/<div className="font-medium text-gray-900 dark:text-white">\{\s*paciente\.nombre\s*\}/, 
        `<div className="flex items-center gap-3">
                                                    {paciente.foto ? (
                                                        <img src={\`http://localhost:3000/pacientes/foto/file/\${paciente.foto}\`} alt="Foto" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 shadow-sm" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                            {paciente.nombre.charAt(0)}{paciente.paterno.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="font-medium text-gray-900 dark:text-white">{paciente.nombre}`);
    fs.writeFileSync('src/components/PacienteList.tsx', c);
}
