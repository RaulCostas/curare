import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receta } from './entities/receta.entity';
import { RecetaDetalle } from './entities/receta-detalle.entity';

@Injectable()
export class RecetaService {
    constructor(
        @InjectRepository(Receta)
        private recetaRepository: Repository<Receta>,
        @InjectRepository(RecetaDetalle)
        private detalleRepository: Repository<RecetaDetalle>,
    ) { }

    async create(createRecetaDto: any) {
        // Extract detalles from DTO
        const { detalles, ...recetaData } = createRecetaDto;

        // Clean userId if 0 or invalid to avoid FK error
        if (!recetaData.userId || recetaData.userId === 0) {
            delete recetaData.userId;
        }

        // Create and save the receta first WITHOUT detalles
        const newReceta = this.recetaRepository.create(recetaData);
        const savedReceta = await this.recetaRepository.save(newReceta) as unknown as Receta;

        // Now save each detalle individually
        if (detalles && detalles.length > 0) {
            for (const detalle of detalles) {
                const { id, ...detalleData } = detalle;
                const newDetalle = this.detalleRepository.create({
                    ...detalleData,
                    recetaId: savedReceta.id
                }) as unknown as RecetaDetalle;
                await this.detalleRepository.save(newDetalle);
            }
        }

        // Fetch the complete receta with all detalles
        const completeReceta = await this.recetaRepository.findOne({
            where: { id: savedReceta.id },
            relations: ['detalles']
        });

        return completeReceta || savedReceta;
    }

    async findAll() {
        return await this.recetaRepository.find({
            relations: ['paciente', 'user', 'doctor', 'detalles'],
            order: {
                fecha: 'DESC',
                id: 'DESC'
            }
        });
    }

    async findOne(id: number) {
        return await this.recetaRepository.findOne({
            where: { id },
            relations: ['paciente', 'user', 'doctor', 'detalles']
        });
    }

    async update(id: number, updateRecetaDto: any) {
        const { detalles, ...recetaData } = updateRecetaDto;

        if (recetaData.userId === 0 || !recetaData.userId) {
            delete recetaData.userId;
        }

        const receta = await this.findOne(id);
        if (!receta) {
            throw new Error(`Receta #${id} not found`);
        }

        // Update header fields
        Object.assign(receta, recetaData);
        await this.recetaRepository.save(receta);

        // If detalles array is passed, replace old detalles with new ones
        if (detalles && Array.isArray(detalles)) {
            await this.detalleRepository.delete({ recetaId: id });

            for (const detalle of detalles) {
                const { id: _, ...detalleData } = detalle;
                if (detalleData.medicamento && detalleData.medicamento.trim() !== '') {
                    const newDetalle = this.detalleRepository.create({
                        ...detalleData,
                        recetaId: id
                    }) as unknown as RecetaDetalle;
                    await this.detalleRepository.save(newDetalle);
                }
            }
        }

        return this.findOne(id);
    }

    async remove(id: number) {
        const receta = await this.findOne(id);
        if (receta) {
            return await this.recetaRepository.remove(receta);
        }
        return null;
    }
}
