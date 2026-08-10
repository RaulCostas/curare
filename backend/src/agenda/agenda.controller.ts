import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

@Controller('agenda')
export class AgendaController {
    constructor(private readonly agendaService: AgendaService) { }

    @Post()
    async create(@Body() createDto: CreateAgendaDto) {
        try {
            // Real database save:
            return await this.agendaService.create(createDto);
        } catch (e) {
            console.error('Controller caught error:', e);
            return {
                error: true,
                message: e.message,
                details: e.detail || e.stack
            };
        }
    }

    @Get()
    findAll(
        @Query('date') date?: string,
        @Query('fechaInicio') fechaInicio?: string,
        @Query('fechaFinal') fechaFinal?: string,
        @Query('pacienteId') pacienteId?: string,
        @Query('usuarioId') usuarioId?: string,
    ) {
        return this.agendaService.findAll(date, fechaInicio, fechaFinal, pacienteId ? +pacienteId : undefined, usuarioId ? +usuarioId : undefined);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.agendaService.findOne(+id);
    }

    @Get('paciente/:id')
    findAllByPaciente(@Param('id') id: string) {
        return this.agendaService.findAllByPaciente(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateAgendaDto) {
        return this.agendaService.update(+id, updateDto);
    }

    @Delete('all/records')
    deleteAll() {
        return this.agendaService.deleteAll();
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Query('userId') userId: string) {
        return this.agendaService.remove(+id, +userId);
    }
}
