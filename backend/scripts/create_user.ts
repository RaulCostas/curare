import { getAppDataSource } from './migration/config';
import { User } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

async function createUser() {
  console.log('Conectando a la base de datos PostgreSQL...');
  const dataSource = await getAppDataSource();
  const userRepo = dataSource.getRepository(User);

  const email = 'raul@gmail.com';
  const rawPassword = '123456';
  const name = 'Raul Admin';
  const estado = 'activo';

  let user = await userRepo.findOneBy({ email });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  if (user) {
    console.log(`El usuario con email "${email}" ya existe. Actualizando datos...`);
    user.name = name;
    user.password = hashedPassword;
    user.estado = estado;
  } else {
    console.log(`Creando nuevo usuario "${name}" (${email})...`);
    user = userRepo.create({
      name,
      email,
      password: hashedPassword,
      estado,
    });
  }

  const savedUser = await userRepo.save(user);
  console.log('\n========================================');
  console.log('  USUARIO CREADO/ACTUALIZADO CON ÉXITO');
  console.log('========================================');
  console.log(`- ID: ${savedUser.id}`);
  console.log(`- Nombre: ${savedUser.name}`);
  console.log(`- Email: ${savedUser.email}`);
  console.log(`- Estado: ${savedUser.estado}`);
  console.log('========================================\n');

  process.exit(0);
}

createUser().catch(err => {
  console.error('Error al crear usuario:', err);
  process.exit(1);
});
