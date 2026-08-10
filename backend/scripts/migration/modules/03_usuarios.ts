import { getAppDataSource, getMdbReader } from '../config';
import { cleanString, cleanDate } from '../utils/formatters';
import { User } from '../../../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

function parseAccessUserDate(val: any): string | null {
  if (!val) return null;
  const str = val.toString().trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
  }
  return cleanDate(val);
}

export async function migrateUsuariosModule() {
  console.log('\n========================================');
  console.log('  INICIANDO MIGRACIÓN: MÓDULO USUARIOS');
  console.log('========================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const userRepo = dataSource.getRepository(User);

  // 1. Limpiar tabla user y reiniciar la secuencia de autoincremento en PostgreSQL
  console.log('Limpiando usuarios y reiniciando secuencia en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE;');

  // 2. Leemos la tabla Usuario desde Access
  const userTable = reader.getTable('Usuario');
  const rows: any[] = userTable.getData();
  console.log(`Se encontraron ${rows.length} registros en la tabla Usuario de Access.\n`);

  let migrados = 0;
  const saltRounds = 10;

  for (const row of rows) {
    const rawId = cleanString(row.IdUsuario);
    if (!rawId) continue;

    // Email = idusuario + "@gmail.com"
    const email = `${rawId.toLowerCase()}@gmail.com`;
    const nombre = cleanString(row.Nombre, rawId.toUpperCase());
    
    // Contraseña hasheada con bcrypt
    const rawPassword = cleanString(row['Contraseña']) || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

    // Fecha
    const fecha = parseAccessUserDate(row.Fecha);

    // Recepcionista (SI/NO)
    const recepcionista = cleanString(row.Recepcion).toUpperCase() === 'SI';

    // Codigo = codigo_proforma
    const rawCodigo = cleanString(row.Codigo);
    const codigoProforma = rawCodigo ? parseInt(rawCodigo, 10) : null;
    const finalCodigoProforma = isNaN(codigoProforma as any) ? null : codigoProforma;

    // Estado
    const estadoStr = cleanString(row.Estado).toUpperCase();
    const estado = (estadoStr === 'ELIMINADO' || estadoStr === 'INACTIVO') ? 'inactivo' : 'activo';

    const userObj = userRepo.create({
      name: nombre,
      email: email,
      password: hashedPassword,
      estado: estado,
      fecha: fecha as any,
      recepcionista: recepcionista,
      codigo_proforma: finalCodigoProforma as any,
    });

    await userRepo.save(userObj);
    migrados++;
  }

  // Ajustar secuencia autoincremental de la tabla user
  await dataSource.query(`SELECT setval('user_id_seq', (SELECT MAX(id) FROM "user"));`);

  console.log('\n========================================');
  console.log(`MIGRACIÓN COMPLETADA CON ÉXITO: USUARIOS`);
  console.log(`- Total usuarios migrados: ${migrados}`);
  console.log('========================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migrateUsuariosModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de usuarios:', err);
      process.exit(1);
    });
}
