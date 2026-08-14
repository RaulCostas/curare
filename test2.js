const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'curare', password: 'root', port: 5433 });
client.connect().then(() => {
  client.query("SELECT id, \"documentoId\", \"firmaData\" FROM firmas_digitales WHERE \"tipoDocumento\" = 'paciente'").then(r => {
    console.log(r.rows.map(x => ({...x, firmaData: x.firmaData.substring(0, 100)})));
    client.end();
  });
});
