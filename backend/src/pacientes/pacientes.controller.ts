import { UseInterceptors, UploadedFile, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

const getPacientesUploadDir = () => {
    const baseDir = (fs.existsSync('/data') && process.platform !== 'win32')
        ? '/data'
        : join(process.cwd(), 'uploads');
    const targetDir = join(baseDir, 'pacientes');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
};

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
        @Query('mesCumpleanos') mesCumpleanos?: string,
    ) {
        return this.pacientesService.findAll(Number(page), Number(limit), search, mesCumpleanos ? Number(mesCumpleanos) : undefined);
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
            destination: (req, file, cb) => {
                cb(null, getPacientesUploadDir());
            },
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
        const cleanName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const dir = getPacientesUploadDir();
        const filePath = join(dir, cleanName);

        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }

        const fallbackPath = join(process.cwd(), 'uploads', 'pacientes', cleanName);
        if (fs.existsSync(fallbackPath)) {
            return res.sendFile(fallbackPath);
        }

        throw new NotFoundException('Foto no encontrada');
    }
}
