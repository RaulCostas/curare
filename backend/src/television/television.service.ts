import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Television } from './entities/television.entity';
import { CreateTelevisionDto } from './dto/create-television.dto';
import { UpdateTelevisionDto } from './dto/update-television.dto';

@Injectable()
export class TelevisionService {
    constructor(
        @InjectRepository(Television)
        private televisionRepository: Repository<Television>,
    ) { }

    async create(createDto: CreateTelevisionDto): Promise<Television> {
        // Check if television already exists
        const existing = await this.televisionRepository.findOne({
            where: { television: createDto.television },
        });

        if (existing) {
            throw new ConflictException('La televisión ya existe');
        }

        const television = this.televisionRepository.create(createDto);
        return await this.televisionRepository.save(television);
    }

    async findAll(): Promise<Television[]> {
        return await this.televisionRepository.find({
            order: { id: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Television | null> {
        return await this.televisionRepository.findOne({
            where: { id },
        });
    }

    async update(id: number, updateDto: UpdateTelevisionDto): Promise<Television> {
        // Check if new television name already exists (if television is being updated)
        if (updateDto.television) {
            const existing = await this.televisionRepository.findOne({
                where: { television: updateDto.television },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException('La televisión ya existe');
            }
        }

        await this.televisionRepository.update(id, updateDto);
        const updated = await this.findOne(id);
        if (!updated) {
            throw new ConflictException('Error al actualizar la televisión');
        }
        return updated;
    }

    async remove(id: number): Promise<void> {
        await this.televisionRepository.update(id, { estado: 'inactivo' });
    }

    async reactivate(id: number): Promise<void> {
        await this.televisionRepository.update(id, { estado: 'activo' });
    }
}
