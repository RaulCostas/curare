import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CasosClinicosService } from './casos_clinicos.service';
import { CreateCasoClinicoDto } from './dto/create-caso-clinico.dto';
import { UpdateCasoClinicoDto } from './dto/update-caso-clinico.dto';

@Controller('casos-clinicos')
export class CasosClinicosController {
    constructor(private readonly casosClinicosService: CasosClinicosService) {}

    @Post()
    create(@Body() createDto: CreateCasoClinicoDto) {
        return this.casosClinicosService.create(createDto);
    }

    @Get()
    findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
    ) {
        return this.casosClinicosService.findAll({ page, limit, search });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.casosClinicosService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateCasoClinicoDto) {
        return this.casosClinicosService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.casosClinicosService.remove(+id);
    }
}
