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

  // Find all pagos_doctores with total > 0 and details count
  const pagosStats = await ds.query(`
    SELECT pd.id, pd."idDoctor", pd.fecha, pd.total, count(d.id) as detail_count
    FROM pagos_doctores pd
    LEFT JOIN pagos_detalle_doctores d ON d."idPagos" = pd.id
    GROUP BY pd.id, pd."idDoctor", pd.fecha, pd.total
    ORDER BY pd.id DESC
  `);

  const emptyPagosWithTotal = pagosStats.filter(p => Number(p.detail_count) === 0 && Number(p.total) > 0);
  const pagosWithDetails = pagosStats.filter(p => Number(p.detail_count) > 0);

  console.log(`Total pagos_doctores: ${pagosStats.length}`);
  console.log(`Pagos WITH details: ${pagosWithDetails.length}`);
  console.log(`Pagos WITH total > 0 but 0 details: ${emptyPagosWithTotal.length}`);
  if (emptyPagosWithTotal.length > 0) {
    console.log('Sample empty pagos with total > 0:', emptyPagosWithTotal.slice(0, 5));
  }

  // Let's check Pago 470 specifically:
  const p470 = pagosStats.find(p => p.id === 470);
  console.log('Pago 470 stats:', p470);

  // Let's check sample pago with details:
  const sampleWithDetails = pagosWithDetails[0];
  console.log('Sample pago WITH details in DB:', sampleWithDetails);
  if (sampleWithDetails) {
    const details = await ds.query(`
      SELECT d.*, h.tratamiento, h.pieza, h.precio as hc_precio, p.nombre as pac_nombre, p.paterno as pac_paterno
      FROM pagos_detalle_doctores d
      LEFT JOIN historia_clinica h ON h.id = d.idhistoria_clinica
      LEFT JOIN pacientes p ON p.id = h."pacienteId"
      WHERE d."idPagos" = ${sampleWithDetails.id}
    `);
    console.log(`Details for Pago ${sampleWithDetails.id}:`, details);
  }

  await ds.destroy();
}

main().catch(console.error);
