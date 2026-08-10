import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrabajoLaboratorio } from './entities/trabajo_laboratorio.entity';

import { CubetasService } from '../cubetas/cubetas.service';

import { Agenda } from '../agenda/entities/agenda.entity';
import { MoreThanOrEqual, Not, In } from 'typeorm';

@Injectable()
export class TrabajosLaboratoriosService {
    constructor(
        @InjectRepository(TrabajoLaboratorio)
        private trabajosRepository: Repository<TrabajoLaboratorio>,
        @InjectRepository(Agenda)
        private agendaRepository: Repository<Agenda>,
        private cubetasService: CubetasService,
    ) { }

    async create(createTrabajoLaboratorioDto: any) {
        if (createTrabajoLaboratorioDto.idCubeta) {
            const cubeta = await this.cubetasService.findOne(createTrabajoLaboratorioDto.idCubeta);
            if (cubeta && cubeta.dentro_fuera === 'DENTRO') {
                await this.cubetasService.update(cubeta.id, { dentro_fuera: 'FUERA' });
            }
        }
        return this.trabajosRepository.save(createTrabajoLaboratorioDto);
    }

    findAll(page: number = 1, limit: number = 10000, search: string = '', estado: string = '') {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10000;
        const skip = (pageNum - 1) * limitNum;

        const query = this.trabajosRepository.createQueryBuilder('trabajo')
            .leftJoinAndSelect('trabajo.laboratorio', 'laboratorio')
            .leftJoinAndSelect('trabajo.paciente', 'paciente')
            .leftJoinAndSelect('trabajo.precioLaboratorio', 'precioLaboratorio')
            .leftJoinAndSelect('trabajo.cubeta', 'cubeta')
            .take(limitNum)
            .skip(skip)
            .orderBy('trabajo.id', 'DESC');

        if (search) {
            query.andWhere(
                '(paciente.nombre ILIKE :search OR paciente.paterno ILIKE :search OR laboratorio.laboratorio ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (estado) {
            query.andWhere('trabajo.estado = :estado', { estado });
        }

        return query.getManyAndCount();
    }

    findOne(id: number) {
        return this.trabajosRepository.findOne({
            where: { id },
            relations: ['laboratorio', 'paciente', 'precioLaboratorio', 'cubeta'],
        });
    }

    async update(id: number, updateTrabajoLaboratorioDto: any) {
        const trabajoActual = await this.findOne(id);

        if (!trabajoActual) {
            return this.trabajosRepository.update(id, updateTrabajoLaboratorioDto);
        }

        const newCubetaId = updateTrabajoLaboratorioDto.idCubeta ? Number(updateTrabajoLaboratorioDto.idCubeta) : null;
        const oldCubetaId = trabajoActual.idCubeta ? Number(trabajoActual.idCubeta) : null;

        // 1. Handle Cubeta Change (Assignment or Swapping)
        // Only if a new valid ID is provided and it differs from the old one
        if (newCubetaId && newCubetaId !== oldCubetaId) {
            // Free up the old cubeta if it existed
            if (oldCubetaId) {
                await this.cubetasService.update(oldCubetaId, { dentro_fuera: 'DENTRO' });
            }
            // Mark the new cubeta as occupied ('FUERA')
            await this.cubetasService.update(newCubetaId, { dentro_fuera: 'FUERA' });
        }

        // 2. Handle Status Completion (Terminado)
        if (updateTrabajoLaboratorioDto.estado === 'terminado') {
            // If it's being marked as finished, the cubeta (either existing or new) should be returned ('DENTRO')
            const targetCubetaId = newCubetaId || oldCubetaId;
            if (targetCubetaId) {
                await this.cubetasService.update(targetCubetaId, { dentro_fuera: 'DENTRO' });
            }
        }

        return this.trabajosRepository.update(id, updateTrabajoLaboratorioDto);
    }

    remove(id: number) {
        return this.trabajosRepository.delete(id);
    }
    /**
     * Finds finished lab works where the patient does NOT have a future appointment
     * (Appointment date >= Work finished date)
     */
    async findTerminadosSinCita() {
        // We select works that are 'terminado'.
        // Then we filter out those where the patient has an appointment >= fecha_terminado.
        // Using QueryBuilder is clearer for this "Not Exists" logic.
        // Assuming 'agenda' table exists and mapped, but since it's a different module, 
        // we might not have the relation mapped in TypeORM trivially if strictly modularized.
        // However, standard SQL subquery works.
        // If Agenda entity is not known here, we use raw subquery or inject AgendaService (circular dep risk).
        // Step 1: Get all 'terminado' works with explicit joins to ensure data presence
        const works = await this.trabajosRepository.createQueryBuilder('trabajo')
            .leftJoinAndSelect('trabajo.paciente', 'paciente')
            .leftJoinAndSelect('trabajo.laboratorio', 'laboratorio')
            .leftJoinAndSelect('trabajo.precioLaboratorio', 'precioLaboratorio')
            .where("trabajo.estado = 'terminado'")
            .orderBy('trabajo.fecha_terminado', 'DESC')
            .getMany();

        const alertWorks: TrabajoLaboratorio[] = [];

        // Step 2: Filter those without future appointments
        for (const work of works) {
            if (!work.fecha_terminado) continue;

            // Count appointments for this patient that are ON or AFTER the work finished date
            // ignoring cancelled or deleted ones
            const apptCount = await this.agendaRepository.count({
                where: {
                    pacienteId: work.idPaciente,
                    fecha: MoreThanOrEqual(work.fecha_terminado),
                    estado: Not(In(['eliminado', 'cancelado', 'Eliminado', 'Cancelado'])) // Handling Case Sensitivity just in case
                }
            });

            if (apptCount === 0) {
                alertWorks.push(work);
            }
        }

        return alertWorks;
    }
}
