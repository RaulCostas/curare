import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;

const MDB_PATH = path.resolve(__dirname, '../../../backups/curare.mdb');

let dataSourceInstance: DataSource | null = null;

export async function getAppDataSource(): Promise<DataSource> {
  if (dataSourceInstance && dataSourceInstance.isInitialized) {
    return dataSourceInstance;
  }

  dataSourceInstance = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespg',
    database: process.env.DB_NAME || 'curare',
    entities: [path.join(__dirname, '../../src/**/*.entity.ts')],
    synchronize: true, // Sincroniza esquema de PostgreSQL si es necesario
    logging: false,
  });

  await dataSourceInstance.initialize();
  console.log('Conexión a PostgreSQL establecida correctamente.');
  return dataSourceInstance;
}

export function getMdbReader(): any {
  if (!fs.existsSync(MDB_PATH)) {
    throw new Error(`No se encontró el archivo MDB en: ${MDB_PATH}`);
  }
  const buffer = fs.readFileSync(MDB_PATH);
  return new MDBReader(buffer);
}
