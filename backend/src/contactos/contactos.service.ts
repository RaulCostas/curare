import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contacto } from './entities/contacto.entity';
import { CreateContactoDto } from './dto/create-contacto.dto';
import { UpdateContactoDto } from './dto/update-contacto.dto';

@Injectable()
export class ContactosService {
    constructor(
        @InjectRepository(Contacto)
        private readonly contactoRepository: Repository<Contacto>,
    ) { }

    async create(createDto: CreateContactoDto): Promise<Contacto> {
        const contacto = this.contactoRepository.create(createDto);
        return await this.contactoRepository.save(contacto);
    }

    async findAll(search?: string, page: number = 1, limit: number = 10): Promise<{ data: Contacto[], total: number }> {
        const query = this.contactoRepository.createQueryBuilder('contacto');

        if (search) {
            query.where(
                '(contacto.contacto LIKE :search OR contacto.celular LIKE :search OR contacto.telefono LIKE :search OR contacto.telefonoof LIKE :search OR contacto.email LIKE :search OR contacto.direccion LIKE :search)',
                { search: `%${search}%` }
            );
        }

        query.orderBy('contacto.contacto', 'ASC');

        const total = await query.getCount();

        if (limit > 0) {
            query.skip((page - 1) * limit).take(limit);
        }

        const data = await query.getMany();

        return { data, total };
    }

    async findOne(id: number): Promise<Contacto> {
        const contacto = await this.contactoRepository.findOne({ where: { id } });
        if (!contacto) {
            throw new NotFoundException(`Contacto #${id} not found`);
        }
        return contacto;
    }

    async update(id: number, updateDto: UpdateContactoDto): Promise<Contacto> {
        const contacto = await this.findOne(id);
        this.contactoRepository.merge(contacto, updateDto);
        return await this.contactoRepository.save(contacto);
    }

    async remove(id: number): Promise<void> {
        const contacto = await this.findOne(id);
        await this.contactoRepository.remove(contacto);
    }
}
