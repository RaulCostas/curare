import { getAppDataSource } from './config';
import { Agenda } from '../../src/agenda/entities/agenda.entity';

async function checkAgendaDates() {
  const dataSource = await getAppDataSource();

  const datesSample = await dataSource.query(`
    SELECT fecha, COUNT(*) as cantidad 
    FROM agenda 
    GROUP BY fecha 
    ORDER BY fecha DESC 
    LIMIT 15;
  `);

  console.log('--- ÚLTIMAS FECHAS CON CITAS EN LA AGENDA MIGRADA ---');
  datesSample.forEach((d: any) => {
    console.log(`Fecha: ${d.fecha} | Citas: ${d.cantidad}`);
  });

  const estadosSample = await dataSource.query(`
    SELECT estado, COUNT(*) as cantidad 
    FROM agenda 
    GROUP BY estado;
  `);

  console.log('\n--- ESTADOS EN LA TABLA AGENDA ---');
  estadosSample.forEach((e: any) => {
    console.log(`Estado: "${e.estado}" | Citas: ${e.cantidad}`);
  });

  process.exit(0);
}

checkAgendaDates();
