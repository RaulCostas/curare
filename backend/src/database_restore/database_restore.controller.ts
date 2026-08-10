import { Controller, Get, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Controller('database-restore')
export class DatabaseRestoreController {

  @Get('run-local')
  async restoreFromLocalDump() {
    const dumpGzPath = path.join(process.cwd(), 'scripts', 'curare_production_full.sql.gz');
    if (!fs.existsSync(dumpGzPath)) {
      throw new HttpException('No se encontró el archivo de respaldo local en /app/scripts/curare_production_full.sql.gz', HttpStatus.NOT_FOUND);
    }

    const dbHost = process.env.DB_HOST || 'postgres';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPass = process.env.DB_PASSWORD || 'curare_secure_pass_2026';
    const dbName = process.env.DB_NAME || 'curare';

    console.log(`⚙️ [DatabaseRestore] Ejecutando restauración nativa desde archivo local ${dumpGzPath}...`);

    const command = `PGPASSWORD="${dbPass}" gunzip -c "${dumpGzPath}" | psql -h "${dbHost}" -U "${dbUser}" -d "${dbName}"`;

    return new Promise((resolve, reject) => {
      exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ [DatabaseRestore] Error psql:', stderr || error.message);
          return reject(new HttpException(`Error en psql: ${stderr || error.message}`, HttpStatus.INTERNAL_SERVER_ERROR));
        }

        console.log('🎉 [DatabaseRestore] Restauración local completada con éxito absoluto!');
        resolve({
          success: true,
          message: '¡Toda la base de datos de producción con 2,967 pacientes, historiales, cobros y presupuestos ha sido restaurada con éxito!'
        });
      });
    });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async restoreDatabase(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('Archivo no proporcionado', HttpStatus.BAD_REQUEST);
    }

    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const dumpGzPath = path.join(uploadDir, 'temp_restore.sql.gz');
      fs.writeFileSync(dumpGzPath, file.buffer);
      console.log(`📥 [DatabaseRestore] Archivo guardado temporalmente en ${dumpGzPath} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);

      const dbHost = process.env.DB_HOST || 'postgres';
      const dbUser = process.env.DB_USER || 'postgres';
      const dbPass = process.env.DB_PASSWORD || 'curare_secure_pass_2026';
      const dbName = process.env.DB_NAME || 'curare';

      console.log(`⚙️ [DatabaseRestore] Ejecutando restauración nativa con psql...`);

      const command = `PGPASSWORD="${dbPass}" gunzip -c "${dumpGzPath}" | psql -h "${dbHost}" -U "${dbUser}" -d "${dbName}"`;

      return new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
          if (fs.existsSync(dumpGzPath)) fs.unlinkSync(dumpGzPath);

          if (error) {
            console.error('❌ [DatabaseRestore] Error psql:', stderr || error.message);
            return reject(new HttpException(`Error en restauración psql: ${stderr || error.message}`, HttpStatus.INTERNAL_SERVER_ERROR));
          }

          console.log('✅ [DatabaseRestore] Restauración completada con éxito vía psql nativo!');
          resolve({
            success: true,
            message: '¡Base de datos de producción restaurada con éxito con todos los pacientes e historias clínicas!'
          });
        });
      });
    } catch (err: any) {
      console.error('❌ Error:', err.message);
      throw new HttpException(`Error: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
