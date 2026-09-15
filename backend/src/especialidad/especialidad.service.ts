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
        const queryParams: any[] = ['terminado'];
        let paramIdx = 2;

        let dateFilters = '';
        if (year) {
            dateFilters += ` AND EXTRACT(YEAR FROM hc.fecha) = $${paramIdx++}`;
            queryParams.push(year);
        }
        if (month) {
            dateFilters += ` AND EXTRACT(MONTH FROM hc.fecha) = $${paramIdx++}`;
            queryParams.push(month);
        }

        let doctorJoinCondition = '';
        if (status && status !== 'ambos') {
            doctorJoinCondition = `AND LOWER(d.estado) = $${paramIdx++}`;
            queryParams.push(status.toLowerCase());
        }

        const query = `
            SELECT 
                e.id AS "id",
                e.especialidad AS "nombre",
                COALESCE(SUM(hc.cantidad), 0)::int AS "cantidad"
            FROM especialidad e
            LEFT JOIN (
                SELECT 
                    hc.id,
                    hc.fecha,
                    hc.cantidad,
                    hc."doctorId",
                    COALESCE(a_dir."idEspecialidad", a_pd."idEspecialidad", hc."especialidadId") AS matched_especialidad_id
                FROM historia_clinica hc
                LEFT JOIN arancel a_dir ON a_dir.id = hc."arancelId"
                LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
                LEFT JOIN arancel a_pd ON a_pd.id = pd."arancelId"
                WHERE hc."estadoTratamiento" = $1
                ${dateFilters}
            ) hc ON hc.matched_especialidad_id = e.id
            LEFT JOIN doctor d ON hc."doctorId" = d.id ${doctorJoinCondition}
            GROUP BY e.id, e.especialidad
            ORDER BY "cantidad" DESC;
        `;

        const rawResults = await this.especialidadRepository.query(query, queryParams);

        return rawResults.map(r => ({
            id: Number(r.id),
            nombre: r.nombre,
            cantidad: parseInt(r.cantidad, 10) || 0
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
