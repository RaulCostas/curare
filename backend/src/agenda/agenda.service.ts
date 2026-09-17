import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agenda } from './entities/agenda.entity';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { ChatbotService } from '../chatbot/chatbot.service';

@Injectable()
export class AgendaService {
    constructor(
        @InjectRepository(Agenda)
        private readonly agendaRepository: Repository<Agenda>,
        @Inject(forwardRef(() => ChatbotService))
        private readonly chatbotService: ChatbotService,
    ) { }

    async create(createDto: CreateAgendaDto): Promise<Agenda> {
        try {
            const { asistenteId, ...rest } = createDto as any;
            const dataToSave: any = { ...rest };
            if (asistenteId !== undefined) {
                dataToSave.personalId = asistenteId;
            }
            if (!dataToSave.fechaAgendado) {
                dataToSave.fechaAgendado = new Date();
            }
            const cita = this.agendaRepository.create(dataToSave);
            const saved = await this.agendaRepository.save(cita);
            return await this.findOne((saved as any).id);
        } catch (error) {
            console.error('Error creating agenda:', error);
            const detail = `DB Error: ${error.message} | Code: ${error.code} | Detail: ${error.detail || 'None'}`;
            throw new BadRequestException(detail);
        }
    }

    async findAll(date?: string, fechaInicio?: string, fechaFinal?: string, pacienteId?: number, usuarioId?: number): Promise<Agenda[]> {
        const query = this.agendaRepository.createQueryBuilder('agenda')
            .leftJoinAndSelect('agenda.paciente', 'paciente')
            .leftJoinAndSelect('paciente.categoria', 'categoria')
            .leftJoinAndSelect('agenda.doctor', 'doctor')
            .leftJoinAndSelect('agenda.proforma', 'proforma')
            .leftJoinAndSelect('agenda.usuario', 'usuario')
            .leftJoinAndSelect('agenda.personal', 'personal')
            .where("agenda.estado != 'eliminado'"); // Filter out deleted

        if (date) {
            query.andWhere('agenda.fecha = :date', { date });
        }

        // Filter by date range (fecha)
        if (fechaInicio) {
            query.andWhere('agenda.fecha >= :fechaInicio', { fechaInicio });
        }
        if (fechaFinal) {
            query.andWhere('agenda.fecha <= :fechaFinal', { fechaFinal });
        }

        // Filter by patient
        if (pacienteId) {
            query.andWhere('agenda.pacienteId = :pacienteId', { pacienteId });
        }

        // Filter by user who created the appointment
        if (usuarioId) {
            query.andWhere('agenda.usuarioId = :usuarioId', { usuarioId });
        }

        query.orderBy('agenda.hora', 'ASC');

        return await query.getMany();
    }

    async findAllByPaciente(pacienteId: number): Promise<Agenda[]> {
        return await this.agendaRepository.find({
            where: { pacienteId }, // Return all history for this patient
            relations: ['paciente', 'doctor', 'proforma', 'usuario', 'personal'],
            order: { fecha: 'DESC', hora: 'ASC' }
        });
    }

    async findOne(id: number): Promise<Agenda> {
        const cita = await this.agendaRepository.findOne({
            where: { id },
            relations: ['paciente', 'doctor', 'proforma', 'usuario', 'personal']
        });
        if (!cita) {
            throw new NotFoundException(`Cita #${id} not found`);
        }
        return cita;
    }

    async update(id: number, updateDto: UpdateAgendaDto): Promise<Agenda> {
        await this.findOne(id); // Ensures entity exists, throws NotFoundException if not
        const { asistenteId, ...rest } = updateDto as any;
        const updateData: any = { ...rest };
        if (asistenteId !== undefined) {
            updateData.personalId = asistenteId;
        }

        await this.agendaRepository.update(id, updateData);
        return await this.findOne(id);
    }

    async remove(id: number, userId: number): Promise<void> {
        console.log(`Soft deleting agenda #${id} by user ${userId}`);
        await this.agendaRepository.update(id, {
            estado: 'eliminado',
            usuarioId: userId
        });
        console.log(`Updated agenda #${id} via direct update query`);
    }

    async findAllByDoctor(doctorId: number): Promise<Agenda[]> {
        return await this.agendaRepository.find({
            where: { doctorId, estado: 'agendado' } as any,
            relations: ['paciente', 'doctor', 'proforma', 'usuario', 'personal'],
            order: { fecha: 'ASC', hora: 'ASC' }
        });
    }

    private formatFechaTexto(fechaStr: string): string {
        if (!fechaStr) return '';
        try {
            // fechaStr usually in 'YYYY-MM-DD'
            const parts = String(fechaStr).split('T')[0].split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);
                const date = new Date(year, month - 1, day);
                const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const diaSemana = dias[date.getDay()];
                const diaNum = date.getDate();
                const mesNom = meses[date.getMonth()];
                return `${diaSemana} ${diaNum} de ${mesNom}`;
            }
            return fechaStr;
        } catch {
            return fechaStr;
        }
    }

    private formatHoraTexto(horaStr: string): string {
        if (!horaStr) return '';
        try {
            const parts = String(horaStr).split(':');
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1] || '00';
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${minutes} ${ampm}`;
        } catch {
            return horaStr;
        }
    }

    async enviarRecordatorio(id: number): Promise<{ success: boolean; message: string }> {
        const cita = await this.findOne(id);
        if (!cita) {
            throw new NotFoundException(`Cita #${id} no encontrada`);
        }
        if (!cita.paciente) {
            throw new BadRequestException('La cita no tiene un paciente asignado');
        }

        if (cita.estado && cita.estado.toLowerCase().trim() === 'confirmado') {
            throw new BadRequestException('Esta cita ya se encuentra confirmada.');
        }

        const celular = cita.paciente.celular || cita.paciente.telefono;
        if (!celular) {
            throw new BadRequestException(`El paciente ${cita.paciente.nombre} no tiene número de celular registrado`);
        }

        let cleanPhone = celular.replace(/\D/g, '');
        if (cleanPhone.length === 8) {
            cleanPhone = '591' + cleanPhone;
        }
        const jid = `${cleanPhone}@s.whatsapp.net`;

        const fechaFormatted = this.formatFechaTexto(cita.fecha);
        const horaFormatted = this.formatHoraTexto(cita.hora);
        const duracionFormatted = `${cita.duracion || 30} minutos`;
        const pacienteNombre = `${cita.paciente.nombre || ''} ${cita.paciente.paterno || ''}`.trim();

        const mensaje = 
`🦷 *Recordatorio de Cita - CURARE CENTRO DENTAL*
Estimado(a) *${pacienteNombre}*, le recordamos su cita programada para el:

📅 Fecha: ${fechaFormatted}
⏰ Hora: ${horaFormatted}
⏱️ Duración: ${duracionFormatted}

Por favor responde con una LETRA:

A ✅ Confirmar Cita
B ❌ Cancelar Cita

📌 Por favor guarda nuestro número para recibir tus recordatorios.`;

        try {
            await this.chatbotService.sendAgendaMenu(jid, mensaje, cita.id);

            // Guardar la fecha y hora del envío del recordatorio
            await this.agendaRepository.update(cita.id, {
                fechaRecordatorioEnviado: new Date(),
            });

            return {
                success: true,
                message: `Recordatorio enviado a ${pacienteNombre} (${celular})`,
            };
        } catch (err: any) {
            const errorMsg = err.message || 'El chatbot no está conectado a WhatsApp';
            throw new BadRequestException(errorMsg);
        }
    }

    async deleteAll(): Promise<{ message: string; deletedCount: number }> {
        try {
            // Count records before deletion
            const count = await this.agendaRepository.count();

            // Delete all records using TRUNCATE which also resets the sequence
            await this.agendaRepository.query('TRUNCATE TABLE agenda RESTART IDENTITY CASCADE');

            return {
                message: `Todos los registros de la tabla Agenda han sido eliminados y el ID ha sido reiniciado`,
                deletedCount: count
            };
        } catch (error) {
            console.error('Error deleting all agenda records:', error);
            throw new InternalServerErrorException(`Error al eliminar registros: ${error.message}`);
        }
    }
}
