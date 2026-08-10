import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

import { DatosCentroDentalService } from './datos_centro_dental.service';
import { CreateDatosCentroDentalDto } from './dto/create-datos-centro-dental.dto';
import { UpdateDatosCentroDentalDto } from './dto/update-datos-centro-dental.dto';

@Controller('datos-centro-dental')
export class DatosCentroDentalController {
  constructor(private readonly service: DatosCentroDentalService) {}

  @Post()
  create(@Body() createDto: CreateDatosCentroDentalDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDatosCentroDentalDto) {
    return this.service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Post(':id/qr')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/qr';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadQr(@Param('id') id: string, @UploadedFile() file: any) {
    return this.service.updateQr(+id, file?.filename);
  }

  @Get('qr/file/:filename')
  serveQr(@Param('filename') filename: string, @Res() res: any) {
    return res.sendFile(filename, { root: './uploads/qr' });
  }
}
