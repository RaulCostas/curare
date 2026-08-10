import { Controller, Get, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Controller(['database-restore', 'api/database-restore'])
export class DatabaseRestoreController {

  @Get('pull-from-github')
  async pullFromGithub() {
    const dumpGzPath = path.join(process.cwd(), 'scripts', 'temp_github_dump.sql.gz');
    
    console.log(`⚙️ [DatabaseRestore] Descargando dump desde GitHub (Plan B)...`);
    
    // URL cruda de GitHub en la rama migration-data
    const githubUrl = 'https://raw.githubusercontent.com/RaulCostas/curare/migration-data/backend/scripts/curare_production_full.sql.gz';

    // Usar curl para descargar el archivo directamente dentro del contenedor
    return new Promise((resolve, reject) => {
      exec(`curl -sL "${githubUrl}" -o "${dumpGzPath}"`, (error) => {
        if (error) return reject(new HttpException('Error descargando desde GitHub', HttpStatus.INTERNAL_SERVER_ERROR));
        
        console.log(`✅ [DatabaseRestore] Descarga exitosa. Ejecutando restauración nativa...`);
        const dbHost = process.env.DB_HOST || 'postgres';
        const dbUser = process.env.DB_USER || 'postgres';
        const dbPass = process.env.DB_PASSWORD || 'curare_secure_pass_2026';
        const dbName = process.env.DB_NAME || 'curare';

        const command = `gunzip -c "${dumpGzPath}" | psql -h "${dbHost}" -U "${dbUser}" -d "${dbName}"`;

        exec(command, { 
          maxBuffer: 1024 * 1024 * 100,
          env: { ...process.env, PGPASSWORD: dbPass }
        }, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ [DatabaseRestore] Error psql:', stderr || error.message);
            return reject(new HttpException(`Error en psql: ${stderr || error.message}`, HttpStatus.INTERNAL_SERVER_ERROR));
          }

          console.log('🎉 [DatabaseRestore] Restauración remota (Pull) completada con éxito absoluto!');
          resolve({
            success: true,
            message: '¡Toda la base de datos de producción con 2,967 pacientes ha sido restaurada con éxito mediante Pull!'
          });
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

      const command = `gunzip -c "${dumpGzPath}" | psql -h "${dbHost}" -U "${dbUser}" -d "${dbName}"`;

      return new Promise((resolve, reject) => {
        exec(command, { 
          maxBuffer: 1024 * 1024 * 100,
          env: { ...process.env, PGPASSWORD: dbPass }
        }, (error, stdout, stderr) => {
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
