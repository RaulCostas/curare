const fs = require('fs');
let c = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

if (!c.includes('import MusicaTelevisionTab')) {
    c = c.replace(/import FichaMedicaTab from '\.\/FichaMedicaTab';\n/, `import FichaMedicaTab from './FichaMedicaTab';\nimport MusicaTelevisionTab from './MusicaTelevisionTab';\n`);
}

if (!c.includes('const [selectedMusicas')) {
    c = c.replace(/const \[categorias, setCategorias\] = useState<any\[\]>\(\[\]\);\n/, `const [categorias, setCategorias] = useState<any[]>([]);\n    const [selectedMusicas, setSelectedMusicas] = useState<number[]>([]);\n    const [selectedTelevisiones, setSelectedTelevisiones] = useState<number[]>([]);\n`);
}

fs.writeFileSync('src/components/PacienteCreateView.tsx', c);
