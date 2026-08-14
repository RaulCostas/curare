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
      INSERT INTO pacientes (
        fecha, paterno, materno, nombre, direccion, telefono, celular, email, 
        casilla, profesion, estado_civil, direccion_oficina, telefono_oficina, 
        fecha_nacimiento, sexo, seguro_medico, poliza, recomendado, responsable, 
        parentesco, direccion_responsable, telefono_responsable, "idCategoria", 
        nomenclatura, tipo_paciente, motivo, estado, foto
      ) VALUES (
        '2023-01-01', 'Perez', 'Lopez', 'Juan', 'Calle 1', '123', '123', 'test@test.com', 
        '', 'Ingeniero', 'Soltero', '', '', 
        '1990-01-01', 'M', '', '', '', '', 
        '', '', '', 0, 
        '', 'NORMAL', '', 'activo', ''
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
