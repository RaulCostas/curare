import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformesService } from './informes.service';
import { InformesController } from './informes.controller';
import { Informe } from './entities/informe.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { InformesPdfService } from './informes-pdf.service';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Informe, Doctor]),
        ChatbotModule
    ],
    controllers: [InformesController],
    providers: [InformesService, InformesPdfService],
    exports: [InformesService, InformesPdfService],
})
export class InformesModule {}
