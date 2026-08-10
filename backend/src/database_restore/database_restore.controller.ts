import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import * as zlib from 'zlib';

@Controller(['database-restore', 'api/database-restore'])
export class DatabaseRestoreController {
  constructor(private dataSource: DataSource) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async restoreDatabase(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('Archivo no proporcionado', HttpStatus.BAD_REQUEST);
    }

    try {
      console.log(`📥 [DatabaseRestore] Recibido archivo dump de ${(file.size / 1024 / 1024).toFixed(2)} MB...`);
      let sqlContent = file.buffer.toString('utf8');

      // Si el archivo está comprimido en gzip (.gz)
      if (file.originalname.endsWith('.gz') || file.mimetype.includes('gzip') || file.buffer[0] === 0x1f && file.buffer[1] === 0x8b) {
        console.log('🗜️ [DatabaseRestore] Descomprimiendo archivo .gz...');
        sqlContent = zlib.gunzipSync(file.buffer).toString('utf8');
      }

      console.log(`⚙️ [DatabaseRestore] Restaurando esquema y registros (${(sqlContent.length / 1024 / 1024).toFixed(2)} MB de SQL)...`);
      
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // Ejecutar la restauración de datos
      await queryRunner.query(sqlContent);
      await queryRunner.release();

      console.log('✅ [DatabaseRestore] Restauración completada con éxito!');
      return { 
        success: true, 
        message: 'Base de datos de producción restaurada con éxito con todos los pacientes, historias clínicas y pagos!' 
      };
    } catch (err: any) {
      console.error('❌ [DatabaseRestore] Error al restaurar:', err);
      throw new HttpException(`Error en restauración: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
