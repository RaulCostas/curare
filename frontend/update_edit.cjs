const fs = require('fs');
let c = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

c = c.replace(/if \(isEditing\) {\s*await api\.patch\(\`\/pacientes\/\$\{id\}\`,\s*payload\);\s*await Swal\.fire/g, 
`if (isEditing) {
                await api.patch(\`/pacientes/\${id}\`, payload);

                if (selectedMusicas.length >= 0) {
                    await api.post(\`/pacientes/\${id}/musica\`, { musicaIds: selectedMusicas });
                }
                if (selectedTelevisiones.length >= 0) {
                    await api.post(\`/pacientes/\${id}/television\`, { televisionIds: selectedTelevisiones });
                }

                await Swal.fire`);

fs.writeFileSync('src/components/PacienteCreateView.tsx', c);
