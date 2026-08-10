import { getAppDataSource } from './config';
import { Cubeta } from '../../src/cubetas/entities/cubeta.entity';
import { TrabajoLaboratorio } from '../../src/trabajos_laboratorios/entities/trabajo_laboratorio.entity';

async function verifyCubetasYTrabajos() {
  const dataSource = await getAppDataSource();

  const cubetaCount = await dataSource.getRepository(Cubeta).count();
  const trabajoCount = await dataSource.getRepository(TrabajoLaboratorio).count();

  console.log('--- VERIFICACIÓN DE CUBETAS Y TRABAJOS EN POSTGRESQL ---');
  console.log(`Total Cubetas en PG: ${cubetaCount}`);
  console.log(`Total Trabajos de Laboratorio en PG: ${trabajoCount}`);

  const sampleCubetas = await dataSource.getRepository(Cubeta).find({ take: 5 });
  console.log('\n--- MUESTRA DE CUBETAS ---');
  sampleCubetas.forEach(c => {
    console.log(`ID: ${c.id} | Codigo: ${c.codigo} | Descripcion: "${c.descripcion}" | DentroFuera: ${c.dentro_fuera} | Estado: ${c.estado}`);
  });

  const sampleTrabajos = await dataSource.getRepository(TrabajoLaboratorio).find({
    take: 5,
    relations: ['laboratorio', 'paciente', 'precioLaboratorio', 'cubeta']
  });

  console.log('\n--- MUESTRA DE TRABAJOS DE LABORATORIO ---');
  sampleTrabajos.forEach(t => {
    console.log(`ID: ${t.id} | AccessID: ${t.access_id} | Fecha: ${t.fecha} | FechaPedido: ${t.fecha_pedido} | Lab: ${t.laboratorio?.laboratorio} | Paciente: ${t.paciente ? `${t.paciente.paterno} ${t.paciente.nombre}` : 'N/A'} | Trabajo: "${t.precioLaboratorio?.detalle}" | Unitario: ${t.precio_unitario} | Total: ${t.total} | Cubeta: ${t.cubeta ? t.cubeta.codigo : 'N/A'}`);
  });

  process.exit(0);
}

verifyCubetasYTrabajos();
