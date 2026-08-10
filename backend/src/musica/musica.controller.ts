import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MusicaService } from './musica.service';
import { CreateMusicaDto } from './dto/create-musica.dto';
import { UpdateMusicaDto } from './dto/update-musica.dto';

@Controller('musica')
export class MusicaController {
    constructor(private readonly musicaService: MusicaService) { }

    @Post()
    create(@Body() createDto: CreateMusicaDto) {
        return this.musicaService.create(createDto);
    }

    @Get()
    findAll() {
        return this.musicaService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.musicaService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateMusicaDto) {
        return this.musicaService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.musicaService.remove(+id);
    }

    @Patch(':id/reactivate')
    reactivate(@Param('id') id: string) {
        return this.musicaService.reactivate(+id);
    }
}
