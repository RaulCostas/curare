import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { Agenda } from './entities/agenda.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Agenda])],
    controllers: [AgendaController],
    providers: [AgendaService],
    exports: [AgendaService],
})
export class AgendaModule { }
