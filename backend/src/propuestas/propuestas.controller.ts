import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropuestasService } from './propuestas.service';
import { CreatePropuestaDto } from './dto/create-propuesta.dto';
import { UpdatePropuestaDto } from './dto/update-propuesta.dto';

@Controller('propuestas')
export class PropuestasController {
    constructor(private readonly propuestasService: PropuestasService) { }

    @Post()
    create(@Body() createPropuestaDto: CreatePropuestaDto) {
        return this.propuestasService.create(createPropuestaDto);
    }

    @Post(':id/convert-to-budget')
    @Post(':id/convertir')
    convertToProforma(
        @Param('id') id: string,
        @Body() body: { letra: string, usuarioId?: number }
    ) {
        return this.propuestasService.convertToProforma(+id, body.letra, body.usuarioId);
    }

    @Post(':id/send-whatsapp')
    @UseInterceptors(FileInterceptor('file'))
    async sendWhatsApp(
        @Param('id') id: string,
        @UploadedFile() file: any,
        @Body('letra') letra?: string,
    ) {
        if (!file || !file.buffer) {
            throw new BadRequestException('No se recibió el archivo PDF para enviar');
        }
        return this.propuestasService.sendWhatsApp(+id, file.buffer, letra);
    }

    @Get()
    findAll() {
        return this.propuestasService.findAll();
    }

    @Get('paciente/:id')
    findAllByPaciente(@Param('id') id: string) {
        return this.propuestasService.findAllByPaciente(+id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.propuestasService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePropuestaDto: UpdatePropuestaDto) {
        return this.propuestasService.update(+id, updatePropuestaDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.propuestasService.remove(+id);
    }
}
