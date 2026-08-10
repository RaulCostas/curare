const fs = require('fs');
let content = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

const targetStr = `            comentarios: ''\r
        }\r
            // Safety fallback for classification to prevent crash`;

const targetStr2 = `            comentarios: ''\n        }\n            // Safety fallback for classification to prevent crash`;

const replaceStr = `            comentarios: ''
        }
    });

    const [countryCode, setCountryCode] = useState('+591');
    const [localCelular, setLocalCelular] = useState('');
    const [categorias, setCategorias] = useState<any[]>([]);

    const countryCodes = [
        { code: '+591', label: '🇧🇴 +591' },
        { code: '+54', label: '🇦🇷 +54' },
        { code: '+55', label: '🇧🇷 +55' },
        { code: '+56', label: '🇨🇱 +56' },
        { code: '+51', label: '🇵🇪 +51' },
        { code: '+595', label: '🇵🇾 +595' },
        { code: '+598', label: '🇺🇾 +598' },
        { code: '+57', label: '🇨🇴 +57' },
        { code: '+52', label: '🇲🇽 +52' },
        { code: '+34', label: '🇪🇸 +34' },
        { code: '+1', label: '🇺🇸 +1' },
    ];

    useEffect(() => {
        if (isEditing) {
            fetchPaciente();
        }
        fetchCategorias();
    }, [id]);

    const fetchCategorias = async () => {
        try {
            const response = await api.get('/categoria-paciente?page=1&limit=9999');
            if (response.data && Array.isArray(response.data.data)) {
                setCategorias(response.data.data.filter((c: any) => c.estado === 'activo'));
            }
        } catch (error) {
            console.error('Error fetching categorias', error);
        }
    };

    const fetchPaciente = async () => {
        try {
            const response = await api.get(\`/pacientes/\${id}\`);
            const data = response.data;
            console.log('Fetched paciente data:', data);

            if (!data.fichaMedica) {
                data.fichaMedica = { ...formData.fichaMedica };
            }

            // Safety fallback for classification to prevent crash`;

content = content.replace(targetStr, replaceStr);
content = content.replace(targetStr2, replaceStr);
fs.writeFileSync('src/components/PacienteCreateView.tsx', content);
