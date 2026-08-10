import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Musica } from './entities/musica.entity';
import { CreateMusicaDto } from './dto/create-musica.dto';
import { UpdateMusicaDto } from './dto/update-musica.dto';

@Injectable()
export class MusicaService {
    constructor(
        @InjectRepository(Musica)
        private musicaRepository: Repository<Musica>,
    ) { }

    async create(createDto: CreateMusicaDto): Promise<Musica> {
        // Check if musica already exists
        const existing = await this.musicaRepository.findOne({
            where: { musica: createDto.musica },
        });

        if (existing) {
            throw new ConflictException('La música ya existe');
        }

        const musica = this.musicaRepository.create(createDto);
        return await this.musicaRepository.save(musica);
    }

    async findAll(): Promise<Musica[]> {
        return await this.musicaRepository.find({
            order: { id: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Musica | null> {
        return await this.musicaRepository.findOne({
            where: { id },
        });
    }

    async update(id: number, updateDto: UpdateMusicaDto): Promise<Musica> {
        // Check if new musica name already exists (if musica is being updated)
        if (updateDto.musica) {
            const existing = await this.musicaRepository.findOne({
                where: { musica: updateDto.musica },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException('La música ya existe');
            }
        }

        await this.musicaRepository.update(id, updateDto);
        const updated = await this.findOne(id);
        if (!updated) {
            throw new ConflictException('Error al actualizar la música');
        }
        return updated;
    }

    async remove(id: number): Promise<void> {
        await this.musicaRepository.update(id, { estado: 'inactivo' });
    }

    async reactivate(id: number): Promise<void> {
        await this.musicaRepository.update(id, { estado: 'activo' });
    }
}
