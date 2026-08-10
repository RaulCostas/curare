import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agenda } from './entities/agenda.entity';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

@Injectable()
export class AgendaService {
    constructor(
        @InjectRepository(Agenda)
        private readonly agendaRepository: Repository<Agenda>,
    ) { }

    async create(createDto: CreateAgendaDto): Promise<Agenda> {
        try {
            const cita = this.agendaRepository.create(createDto);
            return await this.agendaRepository.save(cita);
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
        const cita = await this.findOne(id);
        this.agendaRepository.merge(cita, updateDto);
        return await this.agendaRepository.save(cita);
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
