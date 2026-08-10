const http = require('http');

http.get('http://localhost:3000/pagos-doctores/470', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const parsed = JSON.parse(data);
    console.log('Pago ID:', parsed.id);
    console.log('Doctor:', parsed.doctor?.paterno, parsed.doctor?.nombre);
    console.log('Detalles count:', parsed.detalles?.length);
    console.log('Detalles:', parsed.detalles);
  });
}).on('error', (err) => {
  console.error('Error connecting to backend:', err.message);
});
