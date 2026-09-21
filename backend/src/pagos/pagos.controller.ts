import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Inject, forwardRef } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { TransferSaldoDto } from './dto/transfer-saldo.dto';
import { ChatbotService } from '../chatbot/chatbot.service';
import { PagosPdfService } from './pagos-pdf.service';
import { HistoriaClinicaService } from '../historia_clinica/historia_clinica.service';
import { deduplicateHistoria } from '../utils/historia-utils';

import { PacientesService } from '../pacientes/pacientes.service';
import { ProformasService } from '../proformas/proformas.service';

@Controller('pagos')
export class PagosController {
    constructor(
        private readonly pagosService: PagosService,
        @Inject(forwardRef(() => ChatbotService))
        private readonly chatbotService: ChatbotService,
        private readonly pagosPdfService: PagosPdfService,
        private readonly historiaClinicaService: HistoriaClinicaService,
        private readonly pacientesService: PacientesService,
        @Inject(forwardRef(() => ProformasService))
        private readonly proformasService: ProformasService,
    ) { }

    @Post()
    create(@Body() createDto: CreatePagoDto) {
        console.log('Recibiendo payload para crear pago:', createDto);
        return this.pagosService.create(createDto);
    }

    @Post('whatsapp')
    async sendByWhatsapp(@Body() body: { pacienteId: number; proformaId?: number }) {
        const { pacienteId, proformaId } = body;

        try {
            // 1. Fetch Data
            const patientEntity = await this.pacientesService.findOne(pacienteId);
            if (!patientEntity) {
                return { success: false, message: 'No se encontraron datos del paciente para generar el reporte.' };
            }

            const proformas = await this.proformasService.findAllByPaciente(pacienteId);
            const selectedProforma = proformaId ? proformas.find(p => p.id === proformaId) : null;

            const pagos = await this.pagosService.findAllByPaciente(pacienteId);
            const filteredPagos = (proformaId ? pagos.filter(p => p.proformaId === proformaId || p.proforma?.id === proformaId) : pagos)
                .slice()
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            const historia = await this.historiaClinicaService.findAllByPaciente(pacienteId);
            const rawFilteredHistoria = historia.filter(h => h.estadoTratamiento === 'terminado' && (!proformaId || h.proformaId === proformaId));
            const deduplicatedHistoria = deduplicateHistoria(rawFilteredHistoria)
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            // 2. Generate PDF with matching design and calculations
            const pdfBuffer = await this.pagosPdfService.generatePagosPdf(
                patientEntity,
                selectedProforma,
                filteredPagos,
                deduplicatedHistoria,
                proformas
            );

            // 3. Send via Chatbot
            const phoneNumber = patientEntity.celular;

            if (!phoneNumber) {
                return { success: false, message: 'El paciente no tiene número de celular registrado.' };
            }

            const cleanPhone = phoneNumber.replace(/\D/g, '');
            // Assume 591 if missing and length is 8 (Bolivia mobile)
            const countryCode = cleanPhone.length === 8 ? '591' : '';
            const jid = `${countryCode}${cleanPhone}@s.whatsapp.net`;

            await this.chatbotService.sendMessage(jid, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `Estado_de_Cuentas_${patientEntity.paterno || patientEntity.nombre}.pdf`,
                caption: `Estimado(a) ${patientEntity.nombre}, adjunto encontrará su Estado de Cuentas.`
            });

            return { success: true, message: 'Estado de cuentas enviado por WhatsApp correctamente' };

        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            return { success: false, message: 'Error al enviar el mensaje: ' + error.message };
        }
    }

    @Post(':id/send-whatsapp')
    async sendReciboByWhatsapp(@Param('id') id: string) {
        try {
            const pago = await this.pagosService.findOne(+id);
            if (!pago) {
                return { success: false, message: 'No se encontró el registro de pago.' };
            }

            const paciente = pago.paciente;
            if (!paciente || !paciente.celular) {
                return { success: false, message: 'El paciente no tiene número de celular registrado.' };
            }

            const pacId = paciente.id;
            const proformas = await this.proformasService.findAllByPaciente(pacId);
            const targetProforma = pago.proformaId ? proformas.find(p => p.id === pago.proformaId) : null;
            const historia = await this.historiaClinicaService.findAllByPaciente(pacId);
            const allPacientePagos = await this.pagosService.findAllByPaciente(pacId);

            const pdfBuffer = await this.pagosPdfService.generateReciboSinglePdf(
                pago,
                targetProforma,
                proformas,
                historia,
                allPacientePagos
            );

            const cleanPhone = paciente.celular.replace(/\D/g, '');
            const countryCode = cleanPhone.length === 8 ? '591' : '';
            const jid = `${countryCode}${cleanPhone}@s.whatsapp.net`;

            const reciboNum = pago.recibo ? `R-${pago.recibo}` : `#${pago.id}`;
            const montoStr = pago.moneda === 'Dólares' ? `USD ${Number(pago.monto).toFixed(2)}` : `Bs. ${Number(pago.monto).toFixed(2)}`;

            await this.chatbotService.sendMessage(jid, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `Recibo_Pago_${pago.recibo || pago.id}.pdf`,
                caption: `Estimado(a) ${paciente.nombre}, le enviamos adjunto su recibo de pago ${reciboNum} por un monto de ${montoStr}. ¡Gracias por su preferencia!`
            });

            return { success: true, message: 'Recibo enviado por WhatsApp correctamente' };
        } catch (error) {
            console.error('Error sending recibo WhatsApp:', error);
            return { success: false, message: 'Error al enviar el recibo por WhatsApp: ' + error.message };
        }
    }

    @Get()
    findAll(@Query('fecha') fecha?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        return this.pagosService.findAll(fecha, startDate, endDate);
    }

    @Post('transferir-saldo')
    createTransfer(@Body() transferDto: TransferSaldoDto) {
        return this.pagosService.transferirSaldo(transferDto);
    }

    @Get('paciente/:id')
    findAllByPaciente(@Param('id') id: string) {
        return this.pagosService.findAllByPaciente(+id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.pagosService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdatePagoDto) {
        return this.pagosService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.pagosService.remove(+id);
    }
}
