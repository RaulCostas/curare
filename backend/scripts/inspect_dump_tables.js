const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'curare_production_full.sql'), 'utf8');

const matches = content.match(/INSERT INTO \"[^\"]+\"/gi);
const uniqueInserts = [...new Set(matches)];
console.log('Tables target by INSERT in dump:');
console.log(uniqueInserts);
