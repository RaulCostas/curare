const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgrespg',
  database: 'curare',
  synchronize: false
});

async function main() {
  await ds.initialize();

  try {
    const query = `
      INSERT INTO firmas_digitales (
        "tipoDocumento", "documentoId", "tipoFirma", "firmaData", 
        "usuarioId", "rolFirmante", timestamp, "hashDocumento", 
        "ipAddress", "userAgent", verificado
      ) VALUES (
        'historia_clinica', 1, 'dibujada', 'data:image/png;base64,123', 
        1, 'paciente', NOW(), '123', 
        '1.1.1.1', 'test', false
      ) RETURNING *;
    `;
    const res = await ds.query(query);
    console.log('Insert success:', res);
  } catch (err) {
    console.error('Insert error:', err.message, err.detail, err.hint);
  }

  await ds.destroy();
}

main().catch(console.error);
