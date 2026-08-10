import { getAppDataSource, getMdbReader } from '../config';
import { cleanString } from '../utils/formatters';

export async function migrateContactosModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: CONTACTOS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  console.log('Limpiando tabla contacto en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "contacto" RESTART IDENTITY CASCADE;');

  const reader = getMdbReader();
  const table = reader.getTable('Contactos');
  const rows = table.getData();

  console.log(`Leídos ${rows.length} registros de la tabla Contactos en Access.`);

  let insertedCount = 0;

  for (const row of rows) {
    const contacto = cleanString(row.IdNombre);
    if (!contacto) continue;

    const celular = cleanString(row.Celular);
    const telefono = cleanString(row.Telefono);
    const telefonoof = cleanString(row.TelefonoOf);
    const email = cleanString(row.Email);
    const direccion = cleanString(row.Direccion);

    await dataSource.query(
      `INSERT INTO "contacto" (contacto, celular, telefono, telefonoof, email, direccion, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [contacto, celular, telefono, telefonoof, email, direccion]
    );

    insertedCount++;
  }

  console.log(`\n======================================================`);
  console.log(`  ¡MIGRACIÓN DE CONTACTOS COMPLETADA! (${insertedCount} insertados)`);
  console.log(`======================================================\n`);
}

if (require.main === module) {
  migrateContactosModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración de contactos:', err);
      process.exit(1);
    });
}
