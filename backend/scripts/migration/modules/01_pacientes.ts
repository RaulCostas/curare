import { getAppDataSource, getMdbReader } from '../config';
import { cleanAccessId, cleanString, cleanDate, parseBoolean, cleanCelular } from '../utils/formatters';
import { CategoriaPaciente } from '../../../src/categoria_paciente/entities/categoria_paciente.entity';
import { FichaMedica } from '../../../src/ficha_medica/entities/ficha_medica.entity';
import { DeepPartial } from 'typeorm';

export async function migratePacientesModule() {
  console.log('\n========================================');
  console.log('  INICIANDO MIGRACIÓN: MÓDULO PACIENTES');
  console.log('========================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const categoriaRepo = dataSource.getRepository(CategoriaPaciente);
  const fichaRepo = dataSource.getRepository(FichaMedica);

  // 1. Limpiar tablas y reiniciar secuencias de ID (entorno de pruebas)
  console.log('Limpiando datos y reiniciando secuencias en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "pacientes", "ficha_medica", "categoria_paciente" RESTART IDENTITY CASCADE;');

  // 2. Cargar datos de la tabla Paciente en Access
  const accessTable = reader.getTable('Paciente');
  const rows: any[] = accessTable.getData();
  console.log(`Se encontraron ${rows.length} registros en la tabla Paciente de Access.\n`);

  // 3. Crear categorías de pacientes
  const categoriasMap = new Map<string, CategoriaPaciente>();
  const accessCatSiglas: string[] = [...new Set(rows.map((r: any) => cleanString(r.Categoria)).filter(Boolean))];

  for (const sigla of accessCatSiglas) {
    const key = sigla.toUpperCase();
    if (!categoriasMap.has(key)) {
      const nuevaCatData: DeepPartial<CategoriaPaciente> = {
        sigla: sigla,
        descripcion: `Categoría ${sigla}`,
        color: '#3b82f6',
        estado: 'activo',
      };
      const nuevaCat = categoriaRepo.create(nuevaCatData);
      const savedCat = await categoriaRepo.save(nuevaCat);
      categoriasMap.set(key, savedCat);
      console.log(`[CATEGORIA] Creada categoría: "${sigla}" (ID: ${savedCat.id})`);
    }
  }

  // 4. Preparar Fichas Médicas con los nombres exactos de columnas de Access
  console.log('\nPreparando datos para inserción...');
  const fichasToInsert: any[] = [];
  const pacientesMetaList: { numericId: number; originalId: string; row: any; catObj: CategoriaPaciente | null }[] = [];

  for (const row of rows) {
    const idParsed = cleanAccessId(row.IdPaciente);
    if (!idParsed) continue;

    const catSigla = cleanString(row.Categoria).toUpperCase();
    const catObj = categoriasMap.get(catSigla) || null;

    // Mapeo exacto de las nuevas columnas de Access
    const fichaMedicaData = {
      // Textos
      observaciones: cleanString(row.Observaciones, ''),
      medico_cabecera: cleanString(row.medico_cabecera, ''),
      enfermedad_actual: cleanString(row.enfermedad_actual, ''),
      medicamentos_detalle: cleanString(row.medicamentos_detalle, ''),
      tratamiento: cleanString(row.tratamiento, ''),
      causa_mal_aliento: cleanString(row.causa_mal_aliento, ''),
      comentarios: cleanString(row.comentarios, ''),

      // Toma medicamentos (si/no)
      toma_medicamentos: parseBoolean(row.toma_medicamentos_si),

      // Última consulta
      ultima_consulta: parseBoolean(row['6_meses'])
        ? '6 meses'
        : parseBoolean(row['mas_de_1_año'])
        ? 'mas de 1 año'
        : parseBoolean(row['mas_de_3_años'])
        ? 'mas de 3 años'
        : '',

      // Frecuencia cepillado
      frecuencia_cepillado: parseBoolean(row.una)
        ? 'Una'
        : parseBoolean(row.dos)
        ? 'Dos'
        : parseBoolean(row.tres)
        ? 'Tres'
        : parseBoolean(row.mas)
        ? 'Mas'
        : '',

      // Higiene
      usa_cepillo: parseBoolean(row.usa_cepillo),
      usa_hilo_dental: parseBoolean(row.usa_hilo_dental),
      usa_enjuague: parseBoolean(row.usa_enjuague),

      // Síntomas
      mal_aliento: parseBoolean(row.mal_aliento_si),
      sangra_encias: parseBoolean(row.sangra_encias_si),
      dolor_cara: parseBoolean(row.dolor_cara_si),

      // Enfermedades (Checkboxes)
      alergia_anestesicos: parseBoolean(row.alergia_anestesicos),
      alergias_drogas: parseBoolean(row.alergias_drogas),
      hepatitis: parseBoolean(row.hepatitis),
      asma: parseBoolean(row.asma),
      diabetes: parseBoolean(row.diabetes),
      dolencia_cardiaca: parseBoolean(row.dolencia_cardiaca),
      hipertension: parseBoolean(row.hipertension),
      fiebre_reumatica: parseBoolean(row.fiebre_reumatica),
      diatesis_hemorragia: parseBoolean(row.diatesis_hemorragia),
      sinusitis: parseBoolean(row.sinusitis),
      ulcera_gastroduodenal: parseBoolean(row.ulcera_gastroduodental || row.ulcera_gastroduodenal),
      enfermedades_tiroides: parseBoolean(row.enfermedades_tiroides),
    };

    fichasToInsert.push(fichaMedicaData);
    pacientesMetaList.push({
      numericId: idParsed.numericId,
      originalId: idParsed.originalId,
      row,
      catObj,
    });
  }

  // 5. Insertar Fichas Médicas en lotes recuperando las claves primarias
  console.log(`Insertando ${fichasToInsert.length} fichas médicas en PostgreSQL...`);
  const BATCH_SIZE = 500;
  const createdFichaIds: number[] = [];

  for (let i = 0; i < fichasToInsert.length; i += BATCH_SIZE) {
    const chunk = fichasToInsert.slice(i, i + BATCH_SIZE);
    const res = await fichaRepo
      .createQueryBuilder()
      .insert()
      .into(FichaMedica)
      .values(chunk)
      .returning('id')
      .execute();

    for (const rawObj of res.raw) {
      createdFichaIds.push(rawObj.id);
    }
  }

  console.log(`Fichas médicas insertadas con éxito: ${createdFichaIds.length}`);

  // 6. Insertar Pacientes preservando EXACTAMENTE el ID numérico de Access (P-X -> X)
  console.log(`Insertando ${pacientesMetaList.length} pacientes asignando id = X exactamente...`);

  const sqlInsertHeader = `
    INSERT INTO pacientes (
      id, fecha, access_id, paterno, materno, nombre, direccion, telefono, celular, email,
      casilla, profesion, estado_civil, direccion_oficina, telefono_oficina, fecha_nacimiento,
      sexo, seguro_medico, poliza, recomendado, responsable, parentesco, direccion_responsable,
      telefono_responsable, nomenclatura, tipo_paciente, motivo, estado, "idCategoria", "fichaMedicaId",
      "createdAt", "updatedAt"
    ) VALUES 
  `;

  const now = new Date().toISOString();

  for (let i = 0; i < pacientesMetaList.length; i += BATCH_SIZE) {
    const chunk = pacientesMetaList.slice(i, i + BATCH_SIZE);
    const valuePlaceholders: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    for (let j = 0; j < chunk.length; j++) {
      const idx = i + j;
      const meta = chunk[j];
      const row = meta.row;
      const fichaId = createdFichaIds[idx];

      const fechaNac = cleanDate(row.Fecha_Nacimiento) || '1990-01-01';
      const fechaRegistro = cleanDate(row.Fecha || row.fnum1) || now.split('T')[0];

      const inactivoAccessIds = new Set([
        'P-1145', 'P-1234', 'P-1517', 'P-1691', 'P-1800', 'P-1852', 'P-1890',
        'P-1911', 'P-2122', 'P-2178', 'P-2224', 'P-2423', 'P-2625', 'P-2733',
        'P-431', 'P-535', 'P-578', 'P-730', 'P-731', 'P-746', 'P-815',
        'P-841', 'P-92', 'P-978'
      ]);

      const estadoFinal = inactivoAccessIds.has(meta.originalId) ? 'inactivo' : 'activo';

      const rowParams = [
        meta.numericId, // ID explícito exacto de Access (P-5 -> 5, P-1001 -> 1001)
        fechaRegistro,
        meta.originalId, // "P-5", "P-1001"
        cleanString(row.Paterno),
        cleanString(row.Materno),
        cleanString(row.Nombre),
        cleanString(row.Domicilio || row.Direccion),
        cleanString(row.Telefono_Dom || row.Telefonos),
        cleanCelular(row.Celular),
        cleanString(row.Email),
        cleanString(row.Casilla || row.Casilla_Postal),
        cleanString(row.Profesion),
        cleanString(row.Estado_Civil),
        cleanString(row.Direccion_Oficina),
        cleanString(row.Telefono_Oficina),
        fechaNac,
        cleanString(row.Sexo, 'NO ESPECIFICADO'),
        cleanString(row.Seguro_Medico),
        cleanString(row.Poliza),
        cleanString(row.Recomendado),
        cleanString(row.Responsable),
        cleanString(row.Parentesco),
        cleanString(row.Direccion),
        cleanString(row.Telefonos),
        cleanString(row.Nomenclatura, ''),
        cleanString(row.Tipo_Paciente || row.Tipo_categoria, 'NORMAL'),
        null, // motivo
        estadoFinal,
        meta.catObj ? meta.catObj.id : null,
        fichaId,
        now,
        now,
      ];

      const placeholders = rowParams.map(() => `$${paramIndex++}`).join(', ');
      valuePlaceholders.push(`(${placeholders})`);
      queryParams.push(...rowParams);
    }

    const fullQuery = sqlInsertHeader + valuePlaceholders.join(', ') + ';';
    await dataSource.query(fullQuery, queryParams);
  }

  // Ajustar la secuencia autoincremental de IDs en PostgreSQL al valor máximo actual
  await dataSource.query(`SELECT setval('pacientes_id_seq', (SELECT MAX(id) FROM pacientes));`);

  console.log('\n========================================');
  console.log(`MIGRACIÓN COMPLETADA CON ÉXITO: PACIENTES & FICHA MÉDICA`);
  console.log(`- Total registros insertados: ${pacientesMetaList.length}`);
  console.log('========================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migratePacientesModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de pacientes:', err);
      process.exit(1);
    });
}
