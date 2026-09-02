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
    UploadedFiles,
    Res,
    NotFoundException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { EstudiosComplementariosService } from './estudios_complementarios.service';
import { CreateEstudioComplementarioDto } from './dto/create-estudio-complementario.dto';
import { UpdateEstudioComplementarioDto } from './dto/update-estudio-complementario.dto';

const UPLOAD_DIR = (fs.existsSync('/data') && process.platform !== 'win32')
    ? '/data/estudios_complementarios'
    : join(process.cwd(), 'uploads', 'estudios_complementarios');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storageConfig = diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `estudio-${uniqueSuffix}${ext}`);
    },
});

@Controller('estudios-complementarios')
export class EstudiosComplementariosController {
    constructor(
        private readonly service: EstudiosComplementariosService,
    ) {}

    @Post()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'orden_estudio', maxCount: 1 },
                { name: 'archivo', maxCount: 1 },
            ],
            {
                storage: storageConfig,
                limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
            },
        ),
    )
    async create(
        @Body() createDto: CreateEstudioComplementarioDto,
        @UploadedFiles()
        files?: {
            orden_estudio?: any[];
            archivo?: any[];
        },
    ) {
        const payload = { ...createDto };

        if (files?.orden_estudio && files.orden_estudio.length > 0) {
            payload.orden_estudio_url = `estudios_complementarios/${files.orden_estudio[0].filename}`;
        }
        if (files?.archivo && files.archivo.length > 0) {
            payload.archivo_url = `estudios_complementarios/${files.archivo[0].filename}`;
        }

        return await this.service.create(payload);
    }

    @Get()
    async findAll(@Query('pacienteId') pacienteId?: string) {
        return await this.service.findAll(pacienteId ? Number(pacienteId) : undefined);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.service.findOne(Number(id));
    }

    @Patch(':id')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'orden_estudio', maxCount: 1 },
                { name: 'archivo', maxCount: 1 },
            ],
            {
                storage: storageConfig,
                limits: { fileSize: 50 * 1024 * 1024 },
            },
        ),
    )
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateEstudioComplementarioDto,
        @UploadedFiles()
        files?: {
            orden_estudio?: any[];
            archivo?: any[];
        },
    ) {
        const payload = { ...updateDto };

        if (files?.orden_estudio && files.orden_estudio.length > 0) {
            payload.orden_estudio_url = `estudios_complementarios/${files.orden_estudio[0].filename}`;
        }
        if (files?.archivo && files.archivo.length > 0) {
            payload.archivo_url = `estudios_complementarios/${files.archivo[0].filename}`;
        }

        return await this.service.update(Number(id), payload);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.service.remove(Number(id));
    }

    @Get('file/:filename')
    async serveFile(@Param('filename') filename: string, @Res() res: any) {
        const cleanName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const filePath = join(UPLOAD_DIR, cleanName);

        if (!fs.existsSync(filePath)) {
            // Check in standard uploads folder as fallback
            const fallbackPath = join(process.cwd(), 'uploads', cleanName);
            if (fs.existsSync(fallbackPath)) {
                return res.sendFile(fallbackPath);
            }
            throw new NotFoundException('Archivo no encontrado');
        }

        return res.sendFile(filePath);
    }
}
