import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';
import { Paciente } from './entities/paciente.entity';
import { FichaMedica } from '../ficha_medica/entities/ficha_medica.entity';
import { PacienteMusica } from './entities/paciente-musica.entity';
import { PacienteTelevision } from './entities/paciente-television.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Paciente, FichaMedica, PacienteMusica, PacienteTelevision])],
    controllers: [PacientesController],
    providers: [PacientesService],
    exports: [PacientesService],
})
export class PacientesModule { }
