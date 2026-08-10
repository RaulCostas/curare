import { Controller, Get, Post, Body, Query, Delete, Param, Put } from '@nestjs/common';
import { EgresoInventarioService } from './egreso_inventario.service';
import { CreateEgresoInventarioDto } from './dto/create-egreso-inventario.dto';

@Controller('egreso-inventario')
export class EgresoInventarioController {
    constructor(private readonly egresoService: EgresoInventarioService) { }

    @Post()
    create(@Body() createEgresoDto: CreateEgresoInventarioDto) {
        return this.egresoService.create(createEgresoDto);
    }

    @Get()
    findAll() {
        return this.egresoService.findAll();
    }

    @Get('historial')
    getHistory(
        @Query('inventarioId') inventarioId: number,
        @Query('inicio') inicio?: string,
        @Query('fin') fin?: string
    ) {
        return this.egresoService.findHistory(inventarioId, inicio, fin);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateEgresoDto: CreateEgresoInventarioDto) {
        return this.egresoService.update(+id, updateEgresoDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.egresoService.remove(+id);
    }
}
