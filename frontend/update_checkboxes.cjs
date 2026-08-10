const fs = require('fs');
let content = fs.readFileSync('src/components/PacienteCreateView.tsx', 'utf-8');

// Update checkboxes grid to max 4 columns
content = content.replace(
    /className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-2 mb-2"/,
    'className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 mb-2"'
);

fs.writeFileSync('src/components/PacienteCreateView.tsx', content);
