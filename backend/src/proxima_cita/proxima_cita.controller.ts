import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProximaCitaService } from './proxima_cita.service';
import { CreateProximaCitaDto } from './dto/create-proxima_cita.dto';
import { UpdateProximaCitaDto } from './dto/update-proxima_cita.dto';

@Controller('proxima-cita')
export class ProximaCitaController {
    constructor(private readonly proximaCitaService: ProximaCitaService) { }

    @Post()
    create(@Body() createDto: CreateProximaCitaDto) {
        return this.proximaCitaService.create(createDto);
    }

    @Get()
    findAll() {
        return this.proximaCitaService.findAll();
    }

    @Get('paciente/:id')
    findAllByPaciente(@Param('id') id: string) {
        return this.proximaCitaService.findAllByPaciente(+id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.proximaCitaService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateProximaCitaDto) {
        return this.proximaCitaService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.proximaCitaService.remove(+id);
    }
}
