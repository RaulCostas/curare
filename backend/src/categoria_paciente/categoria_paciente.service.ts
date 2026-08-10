import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CategoriaPaciente } from './entities/categoria_paciente.entity';
import { CreateCategoriaPacienteDto } from './dto/create-categoria_paciente.dto';
import { UpdateCategoriaPacienteDto } from './dto/update-categoria_paciente.dto';

@Injectable()
export class CategoriaPacienteService {
    constructor(
        @InjectRepository(CategoriaPaciente)
        private categoriaRepository: Repository<CategoriaPaciente>,
    ) { }

    async create(createDto: CreateCategoriaPacienteDto): Promise<CategoriaPaciente> {
        const categoria = this.categoriaRepository.create(createDto);
        return await this.categoriaRepository.save(categoria);
    }

    async findAll(page: number = 1, limit: number = 10, search: string = ''): Promise<{ data: CategoriaPaciente[], total: number, page: number, limit: number, totalPages: number }> {
        const skip = (page - 1) * limit;
        const [data, total] = await this.categoriaRepository.findAndCount({
            where: [
                { descripcion: ILike(`%${search}%`) },
                { sigla: ILike(`%${search}%`) }
            ],
            order: { id: 'DESC' },
            take: limit,
            skip: skip,
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<CategoriaPaciente> {
        const categoria = await this.categoriaRepository.findOne({ where: { id } });
        if (!categoria) {
            throw new Error('Categoria not found');
        }
        return categoria;
    }

    async update(id: number, updateDto: UpdateCategoriaPacienteDto): Promise<CategoriaPaciente> {
        await this.categoriaRepository.update(id, updateDto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.categoriaRepository.delete(id);
    }
}
