import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { SecuenciaTratamientoService } from './secuencia_tratamiento.service';
import { CreateSecuenciaTratamientoDto, UpdateSecuenciaTratamientoDto } from './dto/create-secuencia_tratamiento.dto';

@Controller('secuencia-tratamiento')
export class SecuenciaTratamientoController {
    constructor(private readonly service: SecuenciaTratamientoService) { }

    @Post()
    create(@Body() createDto: CreateSecuenciaTratamientoDto) {
        return this.service.create(createDto);
    }

    @Get('proforma/:id')
    findByProforma(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByProformaId(id);
    }

    @Get('exists/:pacienteId/:proformaId')
    async checkExists(
        @Param('pacienteId', ParseIntPipe) pacienteId: number,
        @Param('proformaId', ParseIntPipe) proformaId: number
    ) {
        const exists = await this.service.checkExists(pacienteId, proformaId);
        return { exists };
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateSecuenciaTratamientoDto) {
        return this.service.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }

}
