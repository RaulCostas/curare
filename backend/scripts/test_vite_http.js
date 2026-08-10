const http = require('http');

http.get('http://localhost:5173/', (res) => {
  console.log('Vite server status code:', res.statusCode);
}).on('error', (err) => {
  console.error('Vite server error:', err.message);
});
