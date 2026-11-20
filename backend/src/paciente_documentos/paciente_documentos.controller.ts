import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseInterceptors,
    UploadedFile,
    Res,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { PacienteDocumentosService, getPacienteDocumentosUploadDir } from './paciente_documentos.service';
import { CreatePacienteDocumentoDto } from './dto/create-paciente_documento.dto';
import { UpdatePacienteDocumentoDto } from './dto/update-paciente_documento.dto';

const storageConfig = diskStorage({
    destination: (req, file, cb) => {
        cb(null, getPacienteDocumentosUploadDir());
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `pacdoc-${uniqueSuffix}${ext}`);
    },
});

@Controller('paciente-documentos')
export class PacienteDocumentosController {
    constructor(private readonly service: PacienteDocumentosService) {}

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: storageConfig,
            limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
        }),
    )
    async create(
        @Body() createDto: CreatePacienteDocumentoDto,
        @UploadedFile() file?: any,
    ) {
        if (!createDto.pacienteId) {
            throw new BadRequestException('El pacienteId es requerido');
        }
        if (!createDto.titulo) {
            throw new BadRequestException('El título del documento es requerido');
        }
        if (!file) {
            throw new BadRequestException('Debe adjuntar el archivo del documento');
        }
        return this.service.create(createDto, file);
    }

    @Get()
    findByPaciente(
        @Query('pacienteId') pacienteId: string,
        @Query('search') search?: string,
    ) {
        if (!pacienteId) {
            throw new BadRequestException('pacienteId es requerido');
        }
        return this.service.findByPaciente(+pacienteId, search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(+id);
    }

    @Patch(':id')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: storageConfig,
            limits: { fileSize: 50 * 1024 * 1024 },
        }),
    )
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdatePacienteDocumentoDto,
        @UploadedFile() file?: any,
    ) {
        return this.service.update(+id, updateDto, file);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(+id);
    }

    @Get(':id/download')
    async download(@Param('id') id: string, @Res() res: any) {
        const info = await this.service.getFilePath(+id);
        res.download(info.path, info.filename);
    }
}
