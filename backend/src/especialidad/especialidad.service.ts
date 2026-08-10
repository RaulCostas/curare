import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { UpdateEspecialidadDto } from './dto/update-especialidad.dto';
import { Especialidad } from './entities/especialidad.entity';

import { HistoriaClinica } from '../historia_clinica/entities/historia_clinica.entity';

@Injectable()
export class EspecialidadService {
    constructor(
        @InjectRepository(Especialidad)
        private especialidadRepository: Repository<Especialidad>,
        @InjectRepository(HistoriaClinica)
        private historiaClinicaRepository: Repository<HistoriaClinica>,
    ) { }

    create(createEspecialidadDto: CreateEspecialidadDto) {
        const especialidad = this.especialidadRepository.create(createEspecialidadDto);
        return this.especialidadRepository.save(especialidad);
    }

    async getStatistics(year: number, month: number, status: string): Promise<any[]> {
        const query = this.especialidadRepository.createQueryBuilder('especialidad')
            .leftJoin('historia_clinica', 'hc', 'hc.especialidadId = especialidad.id AND hc.estadoTratamiento = :estadoTrat', { estadoTrat: 'terminado' })
            .leftJoin('doctor', 'd', 'hc.doctorId = d.id')
            .select([
                'especialidad.id AS "id"',
                'especialidad.especialidad AS "nombre"', // It's called 'especialidad' in entity
                'COALESCE(SUM(hc.cantidad), 0) AS "cantidad"'
            ])
            .groupBy('especialidad.id')
            .addGroupBy('especialidad.especialidad')
            .orderBy('"cantidad"', 'DESC');

        // Date Filter
        let dateCondition = 'hc.estadoTratamiento = :estadoTrat';
        const params: any = { estadoTrat: 'terminado' };

        if (year) {
            dateCondition += ' AND EXTRACT(YEAR FROM hc.fecha) = :year';
            params.year = year;
        }
        if (month) {
            dateCondition += ' AND EXTRACT(MONTH FROM hc.fecha) = :month';
            params.month = month;
        }

        const qb = this.especialidadRepository.createQueryBuilder('especialidad')
            .leftJoin(
                'historia_clinica',
                'hc',
                `hc.especialidadId = especialidad.id AND ${dateCondition}`,
                params
            )
            .leftJoin('doctor', 'd', 'hc.doctorId = d.id')
            .select([
                'especialidad.id AS "id"',
                'especialidad.especialidad AS "nombre"',
                'COALESCE(SUM(hc.cantidad), 0) AS "cantidad"'
            ])
            .groupBy('especialidad.id')
            .addGroupBy('especialidad.especialidad')
            .orderBy('"cantidad"', 'DESC');

        if (status && status !== 'ambos') {
            qb.where('d.estado = :status', { status: status.toLowerCase() });
        }

        const rawResults = await qb.getRawMany();

        return rawResults.map(r => ({
            id: r.id,
            nombre: r.nombre,
            cantidad: parseInt(r.cantidad)
        }));
    }

    async findAll(search?: string, page: number = 1, limit: number = 5) {
        const skip = (page - 1) * limit;
        const where = search
            ? { especialidad: ILike(`%${search}%`) }
            : {};

        const [data, total] = await this.especialidadRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { especialidad: 'ASC' },
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    findOne(id: number) {
        return this.especialidadRepository.findOneBy({ id });
    }

    update(id: number, updateEspecialidadDto: UpdateEspecialidadDto) {
        return this.especialidadRepository.update(id, updateEspecialidadDto);
    }

    remove(id: number) {
        return this.especialidadRepository.delete(id);
    }
}
