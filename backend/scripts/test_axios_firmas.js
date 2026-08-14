const axios = require('axios');
axios.post('http://localhost:3000/firmas', {
    tipoDocumento: 'historia_clinica',
    documentoId: 1,
    tipoFirma: 'dibujada',
    firmaData: 'data:image/png;base64,123',
    rolFirmante: 'paciente',
    hashDocumento: '123',
    ipAddress: '1.1.1.1',
    userAgent: 'test',
    usuarioId: 1
}).then(res => console.log('SUCCESS:', res.data))
  .catch(e => console.log('ERROR:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message));
