import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { Agenda } from './entities/agenda.entity';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Agenda]),
        forwardRef(() => ChatbotModule),
    ],
    controllers: [AgendaController],
    providers: [AgendaService],
    exports: [AgendaService],
})
export class AgendaModule { }
