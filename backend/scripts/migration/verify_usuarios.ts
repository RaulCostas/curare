import { getAppDataSource } from './config';
import { User } from '../../src/users/entities/user.entity';

async function verifyUsuarios() {
  const dataSource = await getAppDataSource();
  const userRepo = dataSource.getRepository(User);

  const count = await userRepo.count();
  console.log(`=== VERIFICACIÓN DE USUARIOS EN POSTGRESQL ===`);
  console.log(`- Total usuarios en PostgreSQL: ${count}`);

  const sampleUsers = await userRepo.find({
    order: { id: 'ASC' },
    take: 10,
  });

  console.log('\n--- MUESTRA DE LOS PRIMEROS 10 USUARIOS ---');
  for (const u of sampleUsers) {
    console.log({
      id: u.id,
      name: u.name,
      email: u.email,
      fecha: u.fecha,
      estado: u.estado,
      recepcionista: u.recepcionista,
      codigo_proforma: u.codigo_proforma,
    });
  }

  process.exit(0);
}

verifyUsuarios();
