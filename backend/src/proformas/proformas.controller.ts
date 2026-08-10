import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Res, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProformasService } from './proformas.service';
import { CreateProformaDto } from './dto/create-proforma.dto';
import { UpdateProformaDto } from './dto/update-proforma.dto';

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
      destination: './uploads/proformas',
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
    return res.sendFile(filename, { root: './uploads/proformas' });
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
