const axios = require('axios');

async function triggerLocalRestore() {
  const url = 'http://72.61.76.125/api/database-restore/run-local';
  console.log(`🚀 Activando migración instantánea local en el servidor: ${url}...`);

  try {
    const response = await axios.get(url, { timeout: 300000 });
    console.log('🎉 RESULTADO DE LA MIGRACIÓN:', response.data);
  } catch (err) {
    if (err.response) {
      console.error('❌ Error respuesta servidor:', err.response.status, err.response.data);
    } else {
      console.error('❌ Error de conexión:', err.message);
    }
  }
}

triggerLocalRestore();
