import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrabajosLaboratoriosService } from './trabajos_laboratorios.service';
import { TrabajosLaboratoriosController } from './trabajos_laboratorios.controller';
import { TrabajoLaboratorio } from './entities/trabajo_laboratorio.entity';
import { CubetasModule } from '../cubetas/cubetas.module';

import { Agenda } from '../agenda/entities/agenda.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TrabajoLaboratorio, Agenda]), CubetasModule],
    controllers: [TrabajosLaboratoriosController],
    providers: [TrabajosLaboratoriosService],
})
export class TrabajosLaboratoriosModule { }
