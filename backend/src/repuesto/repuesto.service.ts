import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repuesto } from './entities/repuesto.entity';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { UpdateRepuestoDto } from './dto/update-repuesto.dto';

@Injectable()
export class RepuestoService {
    constructor(
        @InjectRepository(Repuesto)
        private readonly repuestoRepository: Repository<Repuesto>,
    ) {}

    async create(createRepuestoDto: CreateRepuestoDto): Promise<Repuesto> {
        const nuevo = this.repuestoRepository.create(createRepuestoDto);
        return await this.repuestoRepository.save(nuevo);
    }

    async findAll(query?: { page?: number; limit?: number; search?: string; consultorio?: string; startDate?: string; endDate?: string }): Promise<{ data: Repuesto[]; total: number; page: number; totalPages: number }> {
        const page = query?.page ? Number(query.page) : 1;
        const limit = query?.limit ? Number(query.limit) : 10;
        const skip = (page - 1) * limit;

        const qb = this.repuestoRepository.createQueryBuilder('r');

        if (query?.search && query.search.trim()) {
            const term = `%${query.search.trim().toLowerCase()}%`;
            qb.andWhere(
                '(LOWER(r.descripcion) LIKE :term OR LOWER(r.motivo) LIKE :term)',
                { term }
            );
        }

        if (query?.consultorio && query.consultorio.trim()) {
            const rawVal = query.consultorio.trim();
            const numMatch = rawVal.match(/\d+/);
            if (numMatch) {
                const num = numMatch[0];
                qb.andWhere(
                    '(TRIM(LOWER(r.consultorio)) = :exactNum OR LOWER(r.consultorio) = :consultorioTxt OR LOWER(r.consultorio) LIKE :likeVal)',
                    {
                        exactNum: num,
                        consultorioTxt: `consultorio ${num}`,
                        likeVal: `%${rawVal.toLowerCase()}%`
                    }
                );
            } else {
                const consultorioTerm = `%${rawVal.toLowerCase()}%`;
                qb.andWhere('LOWER(r.consultorio) LIKE :consultorioTerm', { consultorioTerm });
            }
        }

        if (query?.startDate && query?.endDate) {
            const startStr = query.startDate.split('T')[0];
            const endStr = query.endDate.split('T')[0];
            qb.andWhere('r.fecha BETWEEN :startStr AND :endStr', { startStr, endStr });
        } else if (query?.startDate) {
            const startStr = query.startDate.split('T')[0];
            qb.andWhere('r.fecha >= :startStr', { startStr });
        } else if (query?.endDate) {
            const endStr = query.endDate.split('T')[0];
            qb.andWhere('r.fecha <= :endStr', { endStr });
        }

        qb.orderBy('r.fecha', 'DESC')
          .addOrderBy('r.id', 'DESC')
          .skip(skip)
          .take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    async getConsultorios(): Promise<string[]> {
        const results = await this.repuestoRepository
            .createQueryBuilder('r')
            .select('DISTINCT r.consultorio', 'consultorio')
            .where('r.consultorio IS NOT NULL AND TRIM(r.consultorio) != :empty', { empty: '' })
            .getRawMany();

        const consultorios = results
            .map(r => r.consultorio?.trim())
            .filter((c): c is string => Boolean(c));

        return consultorios.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10);
            const numB = parseInt(b.replace(/\D/g, ''), 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a.localeCompare(b, undefined, { numeric: true });
        });
    }

    async findOne(id: number): Promise<Repuesto> {
        const repuesto = await this.repuestoRepository.findOne({ where: { id } });
        if (!repuesto) {
            throw new NotFoundException(`Mantenimiento/Repuesto con ID ${id} no encontrado`);
        }
        return repuesto;
    }

    async update(id: number, updateRepuestoDto: UpdateRepuestoDto): Promise<Repuesto> {
        const repuesto = await this.findOne(id);
        Object.assign(repuesto, updateRepuestoDto);
        return await this.repuestoRepository.save(repuesto);
    }

    async remove(id: number): Promise<void> {
        const repuesto = await this.findOne(id);
        await this.repuestoRepository.remove(repuesto);
    }
}
