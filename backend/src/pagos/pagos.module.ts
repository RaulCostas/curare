import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './entities/pago.entity';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { HistoriaClinicaModule } from '../historia_clinica/historia_clinica.module';
import { PagosPdfService } from './pagos-pdf.service';

import { PacientesModule } from '../pacientes/pacientes.module';
import { ProformasModule } from '../proformas/proformas.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Pago]),
        forwardRef(() => ChatbotModule),
        HistoriaClinicaModule,
        PacientesModule,
        forwardRef(() => ProformasModule)
    ],
    controllers: [PagosController],
    providers: [PagosService, PagosPdfService],
    exports: [PagosService],
})
export class PagosModule { }
