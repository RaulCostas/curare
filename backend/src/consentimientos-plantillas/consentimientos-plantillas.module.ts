import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentimientosPlantillasService } from './consentimientos-plantillas.service';
import { ConsentimientosPlantillasController } from './consentimientos-plantillas.controller';
import { ConsentimientoPlantilla } from './entities/consentimiento-plantilla.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsentimientoPlantilla])],
  controllers: [ConsentimientosPlantillasController],
  providers: [ConsentimientosPlantillasService],
  exports: [ConsentimientosPlantillasService],
})
export class ConsentimientosPlantillasModule {}
