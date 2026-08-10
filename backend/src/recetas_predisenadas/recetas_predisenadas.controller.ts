import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RecetasPredisenadasService } from './recetas_predisenadas.service';

@Controller('recetas-predisenadas')
export class RecetasPredisenadasController {
    constructor(private readonly service: RecetasPredisenadasService) {}

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('especialidadId') especialidadId?: number,
        @Query('estado') estado?: string,
    ) {
        return this.service.findAll(search, especialidadId ? +especialidadId : undefined, estado);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(+id);
    }

    @Post()
    create(@Body() data: any) {
        return this.service.create(data);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.service.update(+id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(+id);
    }
}
