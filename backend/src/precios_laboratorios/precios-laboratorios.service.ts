import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { PrecioLaboratorio } from './entities/precio-laboratorio.entity';
import { CreatePrecioLaboratorioDto } from './dto/create-precio-laboratorio.dto';
import { UpdatePrecioLaboratorioDto } from './dto/update-precio-laboratorio.dto';

@Injectable()
export class PreciosLaboratoriosService {
    constructor(
        @InjectRepository(PrecioLaboratorio)
        private preciosLaboratoriosRepository: Repository<PrecioLaboratorio>,
    ) { }

    create(createPrecioLaboratorioDto: CreatePrecioLaboratorioDto) {
        const precioLaboratorio = this.preciosLaboratoriosRepository.create(createPrecioLaboratorioDto);
        return this.preciosLaboratoriosRepository.save(precioLaboratorio);
    }

    async findAll(page: number = 1, limit: number = 10, search?: string, laboratorioId?: number) {
        const skip = (page - 1) * limit;
        let where: any;

        if (search) {
            const searchConds: any[] = [
                { detalle: ILike(`%${search}%`) },
                { laboratorio: { laboratorio: ILike(`%${search}%`) } }
            ];
            if (laboratorioId) {
                searchConds.forEach(c => c.idLaboratorio = laboratorioId);
            }
            where = searchConds;
        } else if (laboratorioId) {
            where = { idLaboratorio: laboratorioId };
        } else {
            where = {};
        }

        const [data, total] = await this.preciosLaboratoriosRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: {
                detalle: 'ASC',
            },
            relations: ['laboratorio'],
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number) {
        const precioLaboratorio = await this.preciosLaboratoriosRepository.findOne({
            where: { id },
            relations: ['laboratorio'],
        });
        if (!precioLaboratorio) {
            throw new NotFoundException(`PrecioLaboratorio with ID ${id} not found`);
        }
        return precioLaboratorio;
    }

    async update(id: number, updatePrecioLaboratorioDto: UpdatePrecioLaboratorioDto) {
        const precioLaboratorio = await this.preciosLaboratoriosRepository.preload({
            id,
            ...updatePrecioLaboratorioDto,
        });
        if (!precioLaboratorio) {
            throw new NotFoundException(`PrecioLaboratorio with ID ${id} not found`);
        }
        return this.preciosLaboratoriosRepository.save(precioLaboratorio);
    }

    async remove(id: number) {
        const precioLaboratorio = await this.findOne(id);
        return this.preciosLaboratoriosRepository.remove(precioLaboratorio);
    }
}
