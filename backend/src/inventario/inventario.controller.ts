import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateInventarioDto, UpdateInventarioDto } from './dto/create-inventario.dto';

@Controller('inventario')
export class InventarioController {
    constructor(private readonly inventarioService: InventarioService) { }

    @Post()
    create(@Body() createInventarioDto: CreateInventarioDto) {
        return this.inventarioService.create(createInventarioDto);
    }

    @Get('expiration-details')
    findExpirationDetails(@Query('status') status: string) {
        return this.inventarioService.findExpiringDetails(status);
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('expirationStatus') expirationStatus?: string,
    ) {
        return this.inventarioService.findAll(search, page ? +page : 1, limit ? +limit : 10, expirationStatus);
    }

    @Get('alertas/bajo-stock')
    findLowStock() {
        return this.inventarioService.findLowStock();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.inventarioService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateInventarioDto: UpdateInventarioDto) {
        return this.inventarioService.update(+id, updateInventarioDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.inventarioService.remove(+id);
    }
}
