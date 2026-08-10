import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecetaService } from './receta.service';
import { RecetaController } from './receta.controller';
import { Receta } from './entities/receta.entity';
import { RecetaDetalle } from './entities/receta-detalle.entity';
import { RecetaPdfService } from './receta-pdf.service';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Receta, RecetaDetalle]),
        ChatbotModule
    ],
    controllers: [RecetaController],
    providers: [RecetaService, RecetaPdfService],
})
export class RecetaModule { }
