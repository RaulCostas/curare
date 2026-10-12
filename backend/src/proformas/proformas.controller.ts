import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Res, Query, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ProformasService } from './proformas.service';
import { CreateProformaDto } from './dto/create-proforma.dto';
import { UpdateProformaDto } from './dto/update-proforma.dto';

const getProformasUploadDir = () => {
  const baseDir = (fs.existsSync('/data') && process.platform !== 'win32')
    ? '/data'
    : join(process.cwd(), 'uploads');
  const targetDir = join(baseDir, 'proformas');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

@Controller('proformas')
export class ProformasController {
  constructor(private readonly proformasService: ProformasService) { }

  @Post()
  create(@Body() createProformaDto: CreateProformaDto) {
    return this.proformasService.create(createProformaDto);
  }

  @Get()
  findAll(@Query('limit') limit?: number, @Query('page') page?: number) {
    return this.proformasService.findAll(limit, page);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proformasService.findOne(+id);
  }

  @Get('paciente/:id')
  findAllByPaciente(@Param('id') id: string) {
    return this.proformasService.findAllByPaciente(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProformaDto: UpdateProformaDto) {
    return this.proformasService.update(+id, updateProformaDto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body('codigo') codigo: string) {
    return this.proformasService.approve(+id, codigo);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.proformasService.remove(+id);
  }

  @Post(':id/send-whatsapp')
  @UseInterceptors(FileInterceptor('file'))
  async sendWhatsApp(@Param('id') id: string, @UploadedFile() file: any) {
    return this.proformasService.sendWhatsApp(+id, file.buffer);
  }

  @Post(':id/imagenes')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        cb(null, getProformasUploadDir());
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadImage(@Param('id') id: string, @UploadedFile() file: any) {
    return this.proformasService.uploadImage(+id, file.filename, file.path);
  }

  @Get(':id/imagenes')
  getImages(@Param('id') id: string) {
    return this.proformasService.getImages(+id);
  }

  @Get('imagenes/file/:filename')
  serveImage(@Param('filename') filename: string, @Res() res) {
    const cleanName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const dir = getProformasUploadDir();
    const filePath = join(dir, cleanName);

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // Fallback: buscar en carpeta de uploads local del proceso
    const fallbackPath = join(process.cwd(), 'uploads', 'proformas', cleanName);
    if (fs.existsSync(fallbackPath)) {
      return res.sendFile(fallbackPath);
    }

    throw new NotFoundException('Imagen no encontrada');
  }

  @Patch('imagenes/:id/descripcion')
  updateImageDescription(@Param('id') id: string, @Body('descripcion') descripcion: string) {
    return this.proformasService.updateImageDescription(+id, descripcion);
  }

  @Delete('imagenes/:id')
  removeImage(@Param('id') id: string) {
    return this.proformasService.removeImage(+id);
  }
}
