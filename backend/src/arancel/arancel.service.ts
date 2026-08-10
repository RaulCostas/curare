import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateArancelDto } from './dto/create-arancel.dto';
import { UpdateArancelDto } from './dto/update-arancel.dto';
import { UpdatePricesDto } from './dto/update-prices.dto';
import { Especialidad } from '../especialidad/entities/especialidad.entity';
import { Arancel } from './entities/arancel.entity';

@Injectable()
export class ArancelService {
    constructor(
        @InjectRepository(Arancel)
        private arancelRepository: Repository<Arancel>,
    ) { }

    create(createArancelDto: CreateArancelDto) {
        const arancel = this.arancelRepository.create(createArancelDto);
        return this.arancelRepository.save(arancel);
    }

    async findAll(search?: string, page: number = 1, limit: number = 5) {
        const skip = (page - 1) * limit;
        const where = search
            ? { detalle: ILike(`%${search}%`) }
            : {};

        const [data, total] = await this.arancelRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { detalle: 'ASC' },
            relations: ['especialidad'],
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
        return this.arancelRepository.findOne({
            where: { id },
            relations: ['especialidad'],
        });
    }

    update(id: number, updateArancelDto: UpdateArancelDto) {
        return this.arancelRepository.update(id, updateArancelDto);
    }

    remove(id: number) {
        return this.arancelRepository.delete(id);
    }

    async updatePrices(dto: UpdatePricesDto) {
        const query = this.arancelRepository.createQueryBuilder('arancel');

        if (dto.especialidadId && Number(dto.especialidadId) > 0) {
            query.where('arancel.idEspecialidad = :especialidadId', { especialidadId: dto.especialidadId });
        }

        const aranceles = await query.getMany();
        const factor = 1 + (dto.porcentaje / 100);

        for (const arancel of aranceles) {
            if (dto.tipoPrecio === 'precio1' || dto.tipoPrecio === 'ambos') {
                arancel.precio1 = Number((Number(arancel.precio1) * factor).toFixed(2));
            }
            if (dto.tipoPrecio === 'precio2' || dto.tipoPrecio === 'ambos') {
                arancel.precio2 = Number((Number(arancel.precio2) * factor).toFixed(2));
            }
        }

        return this.arancelRepository.save(aranceles);
    }

    async getUsedEspecialidades() {
        const aranceles = await this.arancelRepository
            .createQueryBuilder('arancel')
            .select('DISTINCT arancel.idEspecialidad', 'id')
            .where('arancel.idEspecialidad IS NOT NULL')
            .getRawMany();

        if (aranceles.length === 0) {
            return [];
        }

        const ids = aranceles.map(a => a.id);

        return this.arancelRepository.manager.createQueryBuilder()
            .select('especialidad')
            .from(Especialidad, 'especialidad')
            .where('especialidad.id IN (:...ids)', { ids })
            .orderBy('especialidad.especialidad', 'ASC')
            .getMany();
    }
}
