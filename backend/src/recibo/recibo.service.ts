import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Recibo } from './entities/recibo.entity';
import { CreateReciboDto } from './dto/create-recibo.dto';
import { UpdateReciboDto } from './dto/update-recibo.dto';

@Injectable()
export class ReciboService {
    constructor(
        @InjectRepository(Recibo)
        private readonly reciboRepository: Repository<Recibo>,
    ) {}

    async create(createReciboDto: CreateReciboDto): Promise<Recibo> {
        if (!createReciboDto.accessId) {
            const lastRecibo = await this.reciboRepository
                .createQueryBuilder('r')
                .where("r.accessId ~ '^[0-9]+$'")
                .orderBy('CAST(r.accessId AS INTEGER)', 'DESC')
                .getOne();

            let nextNum = 1;
            if (lastRecibo && lastRecibo.accessId) {
                nextNum = parseInt(lastRecibo.accessId, 10) + 1;
            } else {
                const count = await this.reciboRepository.count();
                nextNum = count + 1;
            }
            createReciboDto.accessId = String(nextNum).padStart(6, '0');
        }

        const nuevo = this.reciboRepository.create(createReciboDto);
        return await this.reciboRepository.save(nuevo);
    }

    async findAll(query?: { page?: number; limit?: number; search?: string }): Promise<{ data: Recibo[]; total: number; page: number; totalPages: number }> {
        const page = query?.page ? Number(query.page) : 1;
        const limit = query?.limit ? Number(query.limit) : 10;
        const skip = (page - 1) * limit;

        const qb = this.reciboRepository.createQueryBuilder('r');

        if (query?.search) {
            const term = `%${query.search.trim().toLowerCase()}%`;
            qb.where(
                'LOWER(r.nombre) LIKE :term OR LOWER(r.concepto) LIKE :term OR LOWER(CAST(r.id AS text)) LIKE :term',
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

    async findOne(id: number): Promise<Recibo> {
        const recibo = await this.reciboRepository.findOne({ where: { id } });
        if (!recibo) {
            throw new NotFoundException(`Recibo con ID ${id} no encontrado`);
        }
        return recibo;
    }

    async update(id: number, updateReciboDto: UpdateReciboDto): Promise<Recibo> {
        const recibo = await this.findOne(id);
        Object.assign(recibo, updateReciboDto);
        return await this.reciboRepository.save(recibo);
    }

    async remove(id: number): Promise<void> {
        const recibo = await this.findOne(id);
        await this.reciboRepository.remove(recibo);
    }
}
