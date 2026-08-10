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

    async findAll(query?: { page?: number; limit?: number; search?: string }): Promise<{ data: Repuesto[]; total: number; page: number; totalPages: number }> {
        const page = query?.page ? Number(query.page) : 1;
        const limit = query?.limit ? Number(query.limit) : 10;
        const skip = (page - 1) * limit;

        const qb = this.repuestoRepository.createQueryBuilder('r');

        if (query?.search) {
            const term = `%${query.search.trim().toLowerCase()}%`;
            qb.where(
                'LOWER(r.descripcion) LIKE :term OR LOWER(r.consultorio) LIKE :term OR LOWER(r.motivo) LIKE :term OR LOWER(r.observaciones) LIKE :term',
                { term }
            );
        }

        qb.orderBy('r.id', 'DESC')
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
