import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ConsentimientosPacientesService } from './consentimientos-pacientes.service';
import { CreateConsentimientoPacienteDto, UpdateConsentimientoPacienteDto } from './dto/consentimiento-paciente.dto';

@Controller('consentimientos-pacientes')
export class ConsentimientosPacientesController {
  constructor(private readonly service: ConsentimientosPacientesService) {}

  @Post()
  create(@Body() createDto: CreateConsentimientoPacienteDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAllByPaciente(@Query('pacienteId') pacienteId: string) {
    return this.service.findAllByPaciente(+pacienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateConsentimientoPacienteDto) {
    return this.service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
