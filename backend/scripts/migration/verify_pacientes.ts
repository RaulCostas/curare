import { getAppDataSource } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { CategoriaPaciente } from '../../src/categoria_paciente/entities/categoria_paciente.entity';
import { FichaMedica } from '../../src/ficha_medica/entities/ficha_medica.entity';

async function verifyMigration() {
  const dataSource = await getAppDataSource();

  const countPacientes = await dataSource.getRepository(Paciente).count();
  const countCategorias = await dataSource.getRepository(CategoriaPaciente).count();
  const countFichas = await dataSource.getRepository(FichaMedica).count();

  console.log('=== VERIFICACIÓN EN POSTGRESQL ===');
  console.log(`- Total Pacientes: ${countPacientes}`);
  console.log(`- Total Categorías: ${countCategorias}`);
  console.log(`- Total Fichas Médicas: ${countFichas}`);

  const sample = await dataSource.getRepository(Paciente).findOne({
    where: { id: 1 },
    relations: ['categoria', 'fichaMedica'],
  });

  console.log('\n--- PACIENTE ID 1 (Muestra) ---');
  console.log({
    id: sample?.id,
    access_id: sample?.access_id,
    nombre_completo: `${sample?.nombre} ${sample?.paterno} ${sample?.materno}`,
    categoria: sample?.categoria?.sigla,
    ficha: {
      observaciones: sample?.fichaMedica?.observaciones,
      medico_cabecera: sample?.fichaMedica?.medico_cabecera,
      enfermedad_actual: sample?.fichaMedica?.enfermedad_actual,
      toma_medicamentos: sample?.fichaMedica?.toma_medicamentos,
      alergia_anestesicos: sample?.fichaMedica?.alergia_anestesicos,
      ultima_consulta: sample?.fichaMedica?.ultima_consulta,
    }
  });

  process.exit(0);
}

verifyMigration();
