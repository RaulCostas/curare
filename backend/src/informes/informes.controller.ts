import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InformesService } from './informes.service';
import { CreateInformeDto, UpdateInformeDto } from './dto/informe.dto';

@Controller('informes')
export class InformesController {
    constructor(private readonly informesService: InformesService) {}

    @Post()
    create(@Body() createInformeDto: CreateInformeDto, @Req() req?: any) {
        if (!createInformeDto.userId && req?.user?.id) {
            createInformeDto.userId = req.user.id;
        }
        return this.informesService.create(createInformeDto);
    }

    @Get()
    findAll(@Query('pacienteId') pacienteId?: string) {
        if (pacienteId) {
            return this.informesService.findByPaciente(+pacienteId);
        }
        return this.informesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.informesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateInformeDto: UpdateInformeDto, @Req() req?: any) {
        if (!updateInformeDto.userId && req?.user?.id) {
            updateInformeDto.userId = req.user.id;
        }
        return this.informesService.update(+id, updateInformeDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.informesService.remove(+id);
    }

    @Post(':id/send-whatsapp')
    @UseInterceptors(FileInterceptor('file'))
    async sendWhatsApp(@Param('id') id: string, @UploadedFile() file?: any) {
        return this.informesService.sendWhatsApp(+id, file ? file.buffer : null);
    }
}
