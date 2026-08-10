import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialUtilizado } from './entities/material_utilizado.entity';
import { CreateMaterialUtilizadoDto } from './dto/create-material-utilizado.dto';
import { UpdateMaterialUtilizadoDto } from './dto/update-material-utilizado.dto';

@Injectable()
export class MaterialUtilizadoService {
    constructor(
        @InjectRepository(MaterialUtilizado)
        private readonly materialUtilizadoRepository: Repository<MaterialUtilizado>,
    ) { }

    async create(createDto: CreateMaterialUtilizadoDto): Promise<MaterialUtilizado> {
        const material = this.materialUtilizadoRepository.create(createDto);
        return await this.materialUtilizadoRepository.save(material);
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ data: MaterialUtilizado[], total: number }> {
        const [data, total] = await this.materialUtilizadoRepository.findAndCount({
            relations: ['historiaClinica', 'user', 'detalles', 'detalles.inventario'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
        });

        return { data, total };
    }

    async findOne(id: number): Promise<MaterialUtilizado> {
        const material = await this.materialUtilizadoRepository.findOne({
            where: { id },
            relations: ['historiaClinica', 'user', 'detalles', 'detalles.inventario']
        });

        if (!material) {
            throw new NotFoundException(`Material Utilizado con ID ${id} no encontrado`);
        }

        return material;
    }

    async findByHistoriaClinica(historiaClinicaId: number): Promise<MaterialUtilizado | null> {
        return await this.materialUtilizadoRepository.findOne({
            where: { historiaClinicaId },
            relations: ['historiaClinica', 'user', 'detalles', 'detalles.inventario']
        });
    }

    async update(id: number, updateDto: UpdateMaterialUtilizadoDto): Promise<MaterialUtilizado> {
        const material = await this.findOne(id);
        Object.assign(material, updateDto);
        return await this.materialUtilizadoRepository.save(material);
    }

    async remove(id: number): Promise<void> {
        const material = await this.findOne(id);
        await this.materialUtilizadoRepository.remove(material);
    }
}
