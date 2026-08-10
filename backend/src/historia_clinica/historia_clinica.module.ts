import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriaClinicaService } from './historia_clinica.service';
import { HistoriaClinicaController } from './historia_clinica.controller';
import { HistoriaClinica } from './entities/historia_clinica.entity';
import { HistoriaClinicaPdfService } from './historia-clinica-pdf.service';
import { ChatbotModule } from '../chatbot/chatbot.module';

import { Pago } from '../pagos/entities/pago.entity';
import { ProformaDetalle } from '../proformas/entities/proforma-detalle.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([HistoriaClinica, Pago, ProformaDetalle]),
        forwardRef(() => ChatbotModule)
    ],
    controllers: [HistoriaClinicaController],
    providers: [HistoriaClinicaService, HistoriaClinicaPdfService],
    exports: [HistoriaClinicaService]
})
export class HistoriaClinicaModule { }
