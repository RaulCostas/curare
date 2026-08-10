import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentimientosPacientesService } from './consentimientos-pacientes.service';
import { ConsentimientosPacientesController } from './consentimientos-pacientes.controller';
import { ConsentimientoPaciente } from './entities/consentimiento-paciente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsentimientoPaciente])],
  controllers: [ConsentimientosPacientesController],
  providers: [ConsentimientosPacientesService],
  exports: [ConsentimientosPacientesService],
})
export class ConsentimientosPacientesModule {}
