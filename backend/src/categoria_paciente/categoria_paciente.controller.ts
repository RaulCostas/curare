import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CategoriaPacienteService } from './categoria_paciente.service';
import { CreateCategoriaPacienteDto } from './dto/create-categoria_paciente.dto';
import { UpdateCategoriaPacienteDto } from './dto/update-categoria_paciente.dto';

@Controller('categoria-paciente')
export class CategoriaPacienteController {
    constructor(private readonly categoriaService: CategoriaPacienteService) { }

    @Post()
    create(@Body() createDto: CreateCategoriaPacienteDto) {
        return this.categoriaService.create(createDto);
    }

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search: string = '',
    ) {
        return this.categoriaService.findAll(Number(page), Number(limit), search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoriaService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateCategoriaPacienteDto) {
        return this.categoriaService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.categoriaService.remove(+id);
    }
}
