const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'curare_production_full.sql'), 'utf8');
const matches = content.match(/-- Tabla: [^\n]+/gi);
console.log('Order of tables in dump:');
console.log(matches);
