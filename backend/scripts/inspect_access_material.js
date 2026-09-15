const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');
const { Client } = require('pg');

async function main() {
  const buffer = fs.readFileSync('d:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb');
  const reader = new MDBReader(buffer);
  const table = reader.getTable('Material');
  const rows = table.getData();
  console.log('Total Access Material rows:', rows.length);
  console.log('Sample rows:', rows.slice(0, 5));

  const client = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgrespg', database: 'curare' });
  await client.connect();

  const esp = await client.query('SELECT id, especialidad FROM especialidad ORDER BY id');
  console.log('Postgres Especialidades:', esp.rows);

  const grp = await client.query('SELECT id, grupo FROM grupo_inventario ORDER BY id');
  console.log('Postgres Grupos:', grp.rows);

  // Check unique prefixes or anomalies in IdMaterial, IdGrupo_Material, IdEspecialidad_Material
  const idMatSet = new Set();
  const idEspSet = new Set();
  const idGrpSet = new Set();

  rows.forEach(r => {
    idMatSet.add(r.IdMaterial);
    idEspSet.add(r.IdEspecialidad_Material);
    idGrpSet.add(r.IdGrupo_Material);
  });

  console.log('Unique IdEspecialidad values in Access:', Array.from(idEspSet));
  console.log('Unique IdGrupo values in Access:', Array.from(idGrpSet));
  console.log('Total unique IdMaterial:', idMatSet.size);

  await client.end();
}

main().catch(console.error);
