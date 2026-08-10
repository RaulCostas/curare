const fs = require('fs');

let c1 = fs.readFileSync('src/components/PacienteList.tsx', 'utf-8');
c1 = c1.replace(/import PacienteImagenesModal from '\.\/PacienteImagenesModal';\r?\n/, '');
c1 = c1.replace(/\s*const \[showImagenesModal, setShowImagenesModal\].*\r?\n/, '');
c1 = c1.replace(/\s*const \[selectedPacienteIdForImages, setSelectedPacienteIdForImages\].*\r?\n/, '');
fs.writeFileSync('src/components/PacienteList.tsx', c1);

let c2 = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');
c2 = c2.replace(/import SiNoSelector from '\.\/SiNoSelector';\r?\n/, '');
fs.writeFileSync('src/components/PacienteCreateView.tsx', c2);
