const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function uploadDump() {
  const dumpPath = path.resolve(__dirname, 'curare_production_full.sql.gz');
  if (!fs.existsSync(dumpPath)) {
    console.error('❌ No se encontró el archivo curare_production_full.sql.gz');
    process.exit(1);
  }

  const stats = fs.statSync(dumpPath);
  console.log(`🚀 Iniciando transferencia a Producción (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

  const form = new FormData();
  form.append('file', fs.createReadStream(dumpPath), {
    filename: 'curare_production_full.sql.gz',
    contentType: 'application/gzip'
  });

  const url = 'http://72.61.76.125:3001/api/database-restore/upload';

  try {
    console.log(`📡 Enviando a: ${url}...`);
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000 // 5 minutos
    });

    console.log('🎉 RESPUESTA DEL SERVIDOR PRODUCCIÓN:', response.data);
  } catch (err) {
    if (err.response) {
      console.error('❌ Error en el servidor de producción:', err.response.status, err.response.data);
    } else {
      console.error('❌ Error de conexión:', err.message);
    }
  }
}

uploadDump();
