import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ConsentimientosPlantillasService } from './consentimientos-plantillas.service';
import { CreateConsentimientoPlantillaDto, UpdateConsentimientoPlantillaDto } from './dto/consentimiento-plantilla.dto';

@Controller('consentimientos-plantillas')
export class ConsentimientosPlantillasController {
  constructor(private readonly service: ConsentimientosPlantillasService) {}

  @Post()
  create(@Body() createDto: CreateConsentimientoPlantillaDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateConsentimientoPlantillaDto) {
    return this.service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
