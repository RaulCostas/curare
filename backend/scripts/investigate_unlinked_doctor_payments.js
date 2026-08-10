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

  // Find all pagos_doctores with 0 details
  const unlinkedPagos = await ds.query(`
    SELECT pd.id, pd."idDoctor", pd.fecha, pd.total, pd.comision, doc.paterno, doc.nombre
    FROM pagos_doctores pd
    LEFT JOIN pagos_detalle_doctores d ON d."idPagos" = pd.id
    LEFT JOIN doctor doc ON doc.id = pd."idDoctor"
    GROUP BY pd.id, pd."idDoctor", pd.fecha, pd.total, pd.comision, doc.paterno, doc.nombre
    HAVING count(d.id) = 0
    ORDER BY pd.id DESC
  `);

  console.log(`Total pagos_doctores with 0 details: ${unlinkedPagos.length}`);
  console.log('Sample unlinked pagos:', unlinkedPagos.slice(0, 15));

  // Let's test if we can match any unlinked pago with historia_clinica records of the same doctor around the same date
  let matchesCount = 0;
  for (const pago of unlinkedPagos) {
    if (Number(pago.total) <= 0) continue;

    // Find historia_clinica for this doctor on or near the payment date where pagado = 'SI' or 'NO'
    const dateOnly = new Date(pago.fecha).toISOString().split('T')[0];
    const candidateHC = await ds.query(`
      SELECT h.id, h.fecha, h.precio, h.tratamiento, h."pacienteId", h.pagado, h.access_id, h.access_trabajos_doctores_id
      FROM historia_clinica h
      WHERE h."doctorId" = ${pago.idDoctor}
        AND h.fecha BETWEEN '${dateOnly}'::date - INTERVAL '7 days' AND '${dateOnly}'::date + INTERVAL '7 days'
    `);

    if (candidateHC.length > 0) {
      matchesCount++;
      if (matchesCount <= 5) {
        console.log(`\nMatch candidate for Pago ID ${pago.id} (Doc ${pago.paterno} ${pago.nombre}, Date ${dateOnly}, Total ${pago.total}):`);
        console.log('Candidate HC rows:', candidateHC);
      }
    }
  }

  console.log(`\nTotal unlinked pagos with candidate historia_clinica rows within +/- 7 days: ${matchesCount}`);

  await ds.destroy();
}

main().catch(console.error);
