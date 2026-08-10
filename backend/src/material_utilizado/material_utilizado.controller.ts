import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { MaterialUtilizadoService } from './material_utilizado.service';
import { CreateMaterialUtilizadoDto } from './dto/create-material-utilizado.dto';
import { UpdateMaterialUtilizadoDto } from './dto/update-material-utilizado.dto';

@Controller('material-utilizado')
export class MaterialUtilizadoController {
    constructor(private readonly materialUtilizadoService: MaterialUtilizadoService) { }

    @Post()
    create(@Body() createDto: CreateMaterialUtilizadoDto) {
        return this.materialUtilizadoService.create(createDto);
    }

    @Get()
    findAll(
        @Query('page', ParseIntPipe) page: number = 1,
        @Query('limit', ParseIntPipe) limit: number = 10
    ) {
        return this.materialUtilizadoService.findAll(page, limit);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.materialUtilizadoService.findOne(id);
    }

    @Get('historia/:historiaId')
    findByHistoriaClinica(@Param('historiaId', ParseIntPipe) historiaId: number) {
        return this.materialUtilizadoService.findByHistoriaClinica(historiaId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMaterialUtilizadoDto
    ) {
        return this.materialUtilizadoService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.materialUtilizadoService.remove(id);
    }
}
