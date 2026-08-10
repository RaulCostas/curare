const fs = require('fs');
let c = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

// Move uploadFotoReq to be a standard component method outside handleSubmit
if (!c.includes('const uploadFotoReq = async (pId: number | string)')) {
    c = c.replace(/const handleSubmit =/, `
    const uploadFotoReq = async (pId: number | string) => {
        if (selectedFotoFile) {
            const formData = new FormData();
            formData.append('file', selectedFotoFile, 'foto.jpg');
            await api.post(\`/pacientes/\${pId}/foto\`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
    };
    
    const handleSubmit =`);
}

// Ensure the local one inside handleSubmit is removed to avoid duplicate/missing
c = c.replace(/const uploadFotoReq = async \(pId\)[^]*?const finalCelular =/g, 'const finalCelular =');

fs.writeFileSync('src/components/PacienteCreateView.tsx', c);
