import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TelevisionService } from './television.service';
import { CreateTelevisionDto } from './dto/create-television.dto';
import { UpdateTelevisionDto } from './dto/update-television.dto';

@Controller('television')
export class TelevisionController {
    constructor(private readonly televisionService: TelevisionService) { }

    @Post()
    create(@Body() createDto: CreateTelevisionDto) {
        return this.televisionService.create(createDto);
    }

    @Get()
    findAll() {
        return this.televisionService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.televisionService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateTelevisionDto) {
        return this.televisionService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.televisionService.remove(+id);
    }

    @Patch(':id/reactivate')
    reactivate(@Param('id') id: string) {
        return this.televisionService.reactivate(+id);
    }
}
