import { getMdbReader } from './scripts/migration/config';

async function inspectContactos() {
  const reader = getMdbReader();
  const table = reader.getTable('Contactos');
  const rows = table.getData();

  console.log(`Tabla 'Contactos' en Access tiene ${rows.length} registros.`);
  if (rows.length > 0) {
    console.log('Columnas:', Object.keys(rows[0]));
    console.log('\nMuestra de los primeros 5 registros:');
    console.log(rows.slice(0, 5));
  }

  process.exit(0);
}

inspectContactos();
