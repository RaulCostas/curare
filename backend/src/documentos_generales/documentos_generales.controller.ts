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
import { DocumentosGeneralesService, getDocumentosGeneralesUploadDir } from './documentos_generales.service';
import { CreateDocumentoGeneralDto } from './dto/create-documento_general.dto';
import { UpdateDocumentoGeneralDto } from './dto/update-documento_general.dto';

const storageConfig = diskStorage({
    destination: (req, file, cb) => {
        cb(null, getDocumentosGeneralesUploadDir());
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `docgen-${uniqueSuffix}${ext}`);
    },
});

@Controller('documentos-generales')
export class DocumentosGeneralesController {
    constructor(private readonly service: DocumentosGeneralesService) {}

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: storageConfig,
            limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
        }),
    )
    async create(
        @Body() createDto: CreateDocumentoGeneralDto,
        @UploadedFile() file?: any,
    ) {
        if (!createDto.nombre) {
            throw new BadRequestException('El nombre del documento es requerido');
        }
        return this.service.create(createDto, file);
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('estado') estado?: string,
    ) {
        return this.service.findAll(
            search,
            page ? +page : 1,
            limit ? +limit : 10,
            estado,
        );
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
        @Body() updateDto: UpdateDocumentoGeneralDto,
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
