import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PersonalService } from './personal.service';
import { CreatePersonalDto } from './dto/create-personal.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';

@Controller('personal')
export class PersonalController {
    constructor(private readonly personalService: PersonalService) { }

    @Post()
    create(@Body() createPersonalDto: CreatePersonalDto) {
        return this.personalService.create(createPersonalDto);
    }

    @Get('birthdays')
    getBirthdays() {
        return this.personalService.getBirthdays();
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.personalService.findAll(
            search,
            page ? +page : 1,
            limit ? +limit : 5,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.personalService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePersonalDto: UpdatePersonalDto) {
        return this.personalService.update(+id, updatePersonalDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.personalService.remove(+id);
    }
}
