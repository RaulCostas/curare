const fs = require('fs');
let c = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

// Import
if (!c.includes('PacienteFoto')) {
    c = "import PacienteFoto from './PacienteFoto';\n" + c;
}

// State
if (!c.includes('selectedFotoFile')) {
    c = c.replace(/const \[selectedTelevisiones, setSelectedTelevisiones\] = useState<number\[\]>\(\[\]\);/, `const [selectedTelevisiones, setSelectedTelevisiones] = useState<number[]>([]);
    const [selectedFotoFile, setSelectedFotoFile] = useState<File | Blob | null>(null);`);
}

// initialFormData update
if (!c.includes('foto: null')) {
    c = c.replace(/comentarios: '',\n\s*\}\n\s*\};/, `comentarios: '',\n    },\n    foto: null,\n};`);
}

// handleSubmit update for create
if (!c.includes('const uploadFoto = async (pacienteId)')) {
    const uploadFunc = `
            const uploadFotoReq = async (pId) => {
                if (selectedFotoFile) {
                    const formData = new FormData();
                    formData.append('file', selectedFotoFile, 'foto.jpg');
                    await api.post(\`/pacientes/\${pId}/foto\`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            };
    `;
    c = c.replace(/const finalCelular = /, uploadFunc + '\n            const finalCelular = ');
}

// handleSubmit save foto on Create
if (c.includes('if (selectedTelevisiones.length > 0)')) {
    c = c.replace(/if \(selectedTelevisiones\.length > 0\) \{\n\s*await api\.post\(\`\/pacientes\/\$\{newPacienteId\}\/television\`.*?\}\n/, 
    `if (selectedTelevisiones.length > 0) {
                    await api.post(\`/pacientes/\${newPacienteId}/television\`, { televisionIds: selectedTelevisiones });
                }
                await uploadFotoReq(newPacienteId);\n`);
}

// handleSaveAndSign save foto on Create
if (c.includes('if (selectedTelevisiones.length > 0)') && c.includes('handleSaveAndSign')) {
    c = c.replace(/if \(selectedTelevisiones\.length > 0\) \{\n\s*await api\.post\(\`\/pacientes\/\$\{newPacienteId\}\/television\`.*?\}\n/g, 
    `if (selectedTelevisiones.length > 0) {
                    await api.post(\`/pacientes/\${newPacienteId}/television\`, { televisionIds: selectedTelevisiones });
                }
                await uploadFotoReq(newPacienteId);\n`);
}

// Save foto on Edit
if (c.includes('if (isEditing) {')) {
    c = c.replace(/if \(isEditing\) \{\n\s*await api\.patch\(\`\/pacientes\/\$\{id\}\`.*?;\n\s*if \(selectedMusicas\.length >= 0\) \{\n\s*await api\.post\(\`\/pacientes\/\$\{id\}\/musica\`.*?;\n\s*\}\n\s*if \(selectedTelevisiones\.length >= 0\) \{\n\s*await api\.post\(\`\/pacientes\/\$\{id\}\/television\`.*?;\n\s*\}/g,
    `if (isEditing) {
                await api.patch(\`/pacientes/\${id}\`, payload);
                if (selectedMusicas.length >= 0) {
                    await api.post(\`/pacientes/\${id}/musica\`, { musicaIds: selectedMusicas });
                }
                if (selectedTelevisiones.length >= 0) {
                    await api.post(\`/pacientes/\${id}/television\`, { televisionIds: selectedTelevisiones });
                }
                await uploadFotoReq(id)`);
}

// Component UI placement
if (!c.includes('<PacienteFoto')) {
    c = c.replace(/<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">/, 
    `<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="lg:col-span-2 flex justify-center mb-4 no-print">
                                <PacienteFoto 
                                    foto={(formData as any).foto} 
                                    onPhotoSelected={setSelectedFotoFile} 
                                />
                            </div>`);
}

fs.writeFileSync('src/components/PacienteCreateView.tsx', c);
