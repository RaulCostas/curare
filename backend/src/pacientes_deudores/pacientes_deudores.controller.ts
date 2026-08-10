import { Controller, Get, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { PacientesDeudoresService } from './pacientes_deudores.service';

@Controller('pacientes-deudores')
export class PacientesDeudoresController {
    constructor(private readonly pacientesDeudoresService: PacientesDeudoresService) { }

    @Get('pasivos')
    getPasivos() {
        return this.pacientesDeudoresService.findAll('pasivos');
    }

    @Get('activos')
    getActivos() {
        return this.pacientesDeudoresService.findAll('activos');
    }

    @Get('traspasados')
    getTraspasados() {
        return this.pacientesDeudoresService.findAll('traspasados');
    }

    @Get('observados')
    getObservados() {
        return this.pacientesDeudoresService.findAll('observados');
    }

    @Patch('proforma/:id/traspasar')
    updateTraspaso(
        @Param('id', ParseIntPipe) proformaId: number,
        @Body() body: { traspasado: boolean; observacion?: string }
    ) {
        return this.pacientesDeudoresService.updateTraspaso(proformaId, body.traspasado, body.observacion);
    }

    @Patch('proforma/:id/observar')
    updateObservacion(
        @Param('id', ParseIntPipe) proformaId: number,
        @Body() body: { deudaObservada: boolean; observacion?: string }
    ) {
        return this.pacientesDeudoresService.updateDeudaObservada(proformaId, body.deudaObservada, body.observacion);
    }
}
