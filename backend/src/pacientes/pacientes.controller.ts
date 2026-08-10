import { UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Controller('pacientes')
export class PacientesController {
    constructor(private readonly pacientesService: PacientesService) { }

    @Post()
    create(@Body() createPacienteDto: CreatePacienteDto) {
        return this.pacientesService.create(createPacienteDto);
    }


    @Get('pendientes')
    findPendientes(
        @Query('tab') tab: 'agendados' | 'no_agendados',
        @Query('doctorId') doctorId?: string,
        @Query('especialidadId') especialidadId?: string
    ) {
        return this.pacientesService.findPendientes(tab, doctorId ? +doctorId : undefined, especialidadId ? +especialidadId : undefined);
    }

    @Get('no-registrados')
    findNoRegistrados() {
        return this.pacientesService.findNoRegistrados();
    }

    @Get('dashboard-stats')
    getDashboardStats() {
        return this.pacientesService.getDashboardStats();
    }

    @Get('statistics')
    getStatistics(@Query('year') year: string) {
        return this.pacientesService.getStatistics(year ? +year : new Date().getFullYear());
    }


    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search: string = '',
    ) {
        return this.pacientesService.findAll(Number(page), Number(limit), search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.pacientesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePacienteDto: UpdatePacienteDto) {
        return this.pacientesService.update(+id, updatePacienteDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.pacientesService.remove(+id);
    }
    // Endpoints para M�sica
    @Get(':id/musica')
    getPacienteMusica(@Param('id') id: string) {
        return this.pacientesService.getPacienteMusica(+id);
    }

    @Post(':id/musica')
    savePacienteMusica(@Param('id') id: string, @Body() body: { musicaIds: number[] }) {
        return this.pacientesService.savePacienteMusica(+id, body.musicaIds);
    }

    // Endpoints para Televisi�n
    @Get(':id/television')
    getPacienteTelevision(@Param('id') id: string) {
        return this.pacientesService.getPacienteTelevision(+id);
    }

    @Post(':id/television')
    savePacienteTelevision(@Param('id') id: string, @Body() body: { televisionIds: number[] }) {
        return this.pacientesService.savePacienteTelevision(+id, body.televisionIds);
    }

    // Endpoints para Foto
    @Post(':id/foto')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/pacientes',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadFoto(@Param('id') id: string, @UploadedFile() file: any) {
        return this.pacientesService.uploadFoto(+id, file.filename);
    }

    @Get('foto/file/:filename')
    serveFoto(@Param('filename') filename: string, @Res() res: any) {
        return res.sendFile(filename, { root: './uploads/pacientes' });
    }
}
