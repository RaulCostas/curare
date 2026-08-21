const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgrespg',
  database: 'curare',
});

ds.initialize().then(async () => {
  const query = `
    SELECT p.id, p.numero, p."pacienteId"
    FROM proformas p
    WHERE p."pacienteId" = 61 AND p.numero = 2
  `;
  const res = await ds.query(query);
  console.log('Proforma:', res);

  const proformaId = res[0].id;

  const query2 = `
    SELECT id, piezas, cantidad, total
    FROM proforma_detalle
    WHERE "proformaId" = 3898
  `;
  const res2 = await ds.query(query2);
  console.log('Proforma Detalles:', res2);


  ds.destroy();
}).catch(console.error);
