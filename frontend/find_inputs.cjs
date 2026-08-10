const fs = require('fs');

const lines = fs.readFileSync("src/components/PacienteCreateView.tsx", "utf-8").split('\n');

lines.forEach((l, i) => {
    if (l.includes('<input type="text"') || l.includes('<input type="email"') || l.includes('<textarea') || l.includes('<input type="date"')) {
        console.log(`${i+1}: ${l.trim()}`);
    }
});
