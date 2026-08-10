import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacientesDeudoresService } from './pacientes_deudores.service';
import { PacientesDeudoresController } from './pacientes_deudores.controller';
import { HistoriaClinica } from '../historia_clinica/entities/historia_clinica.entity';
import { Proforma } from '../proformas/entities/proforma.entity';
import { Pago } from '../pagos/entities/pago.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HistoriaClinica, Proforma, Pago])],
    controllers: [PacientesDeudoresController],
    providers: [PacientesDeudoresService],
})
export class PacientesDeudoresModule { }
