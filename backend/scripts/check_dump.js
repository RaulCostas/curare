const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'curare_production_full.sql');
const content = fs.readFileSync(file, 'utf8');

const targets = ['doctor', 'egresos', 'pagos', 'historia_clinica', 'proformas', 'personal', 'arancel'];

targets.forEach(t => {
  const hasInsert = content.includes(`INSERT INTO "${t}"`) || content.includes(`INSERT INTO ${t}`);
  console.log(`Table ${t}: ${hasInsert ? 'HAS INSERT DATA' : 'NO INSERT DATA IN DUMP'}`);
});
