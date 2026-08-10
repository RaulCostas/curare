const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const inputFile = path.resolve(__dirname, 'curare_production_full.sql');
const outputFile = path.resolve(__dirname, 'curare_production_full.sql.gz');

console.log('🗜️ Comprimiendo dump SQL...');
const readStream = fs.createReadStream(inputFile);
const writeStream = fs.createWriteStream(outputFile);
const gzip = zlib.createGzip({ level: 9 });

readStream.pipe(gzip).pipe(writeStream).on('finish', () => {
  const inputStats = fs.statSync(inputFile);
  const outputStats = fs.statSync(outputFile);
  console.log(`✅ Archivo comprimido con éxito!`);
  console.log(`Original: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Comprimido: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
});
