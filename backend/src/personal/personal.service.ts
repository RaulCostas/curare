import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { CreatePersonalDto } from './dto/create-personal.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';
import { Personal } from './entities/personal.entity';

@Injectable()
export class PersonalService {
    constructor(
        @InjectRepository(Personal)
        private personalRepository: Repository<Personal>,
    ) { }

    create(createPersonalDto: CreatePersonalDto) {
        const { personalTipoId, ...rest } = createPersonalDto;
        const personal = this.personalRepository.create({
            ...rest,
            personal_tipo_id: personalTipoId,
        });
        return this.personalRepository.save(personal);
    }

    async findAll(search?: string, page: number = 1, limit: number = 5) {
        const skip = (page - 1) * limit;
        const where = search
            ? { nombre: ILike(`%${search}%`) }
            : {};

        const [data, total] = await this.personalRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { nombre: 'ASC', paterno: 'ASC', materno: 'ASC' },
            relations: ['personalTipo'],
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getBirthdays() {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        const birthdays = await this.personalRepository
            .createQueryBuilder('personal')
            .where('personal.estado = :estado', { estado: 'activo' })
            .andWhere('personal.fecha_nacimiento IS NOT NULL')
            .andWhere('EXTRACT(MONTH FROM personal.fecha_nacimiento) = :month', { month })
            .andWhere('EXTRACT(DAY FROM personal.fecha_nacimiento) = :day', { day })
            .getMany();

        return birthdays;
    }

    findOne(id: number) {
        return this.personalRepository.findOneBy({ id });
    }

    update(id: number, updatePersonalDto: UpdatePersonalDto) {
        console.log('=== UPDATE PERSONAL DEBUG ===');
        console.log('ID:', id);
        console.log('Received DTO:', updatePersonalDto);

        const { personalTipoId, personalTipo, ...rest } = updatePersonalDto as any;
        const updateData: any = { ...rest };

        // Only add personal_tipo_id if personalTipoId is present in the DTO
        if ('personalTipoId' in updatePersonalDto) {
            updateData.personal_tipo_id = personalTipoId || null;
            console.log('personalTipoId found in DTO:', personalTipoId);
        } else {
            console.log('personalTipoId NOT in DTO');
        }

        console.log('Final updateData:', updateData);
        console.log('=== END DEBUG ===');

        return this.personalRepository.update(id, updateData);
    }

    remove(id: number) {
        return this.personalRepository.delete(id);
    }

    async findByCelular(celular: string) {
        return this.personalRepository.findOne({
            where: [
                { celular: ILike(`%${celular}%`) },
                { telefono: ILike(`%${celular}%`) }
            ]
        });
    }
}
