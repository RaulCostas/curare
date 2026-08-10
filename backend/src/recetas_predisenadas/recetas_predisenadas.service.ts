import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecetaPredisenada } from './entities/receta_predisenada.entity';
import { RecetaPredisenadaDetalle } from './entities/receta_predisenada_detalle.entity';

@Injectable()
export class RecetasPredisenadasService {
    constructor(
        @InjectRepository(RecetaPredisenada)
        private readonly repository: Repository<RecetaPredisenada>,
        @InjectRepository(RecetaPredisenadaDetalle)
        private readonly detalleRepository: Repository<RecetaPredisenadaDetalle>,
    ) {}

    async findAll(search?: string, especialidadId?: number, estado?: string): Promise<RecetaPredisenada[]> {
        const query = this.repository.createQueryBuilder('tmpl')
            .leftJoinAndSelect('tmpl.detalles', 'detalles');

        if (estado) {
            query.andWhere('tmpl.estado = :estado', { estado });
        }
        if (especialidadId) {
            query.andWhere('tmpl.especialidadId = :especialidadId', { especialidadId });
        }
        if (search) {
            query.andWhere('(LOWER(tmpl.nombre) LIKE LOWER(:search) OR LOWER(tmpl.diagnostico) LIKE LOWER(:search))', {
                search: `%${search}%`
            });
        }

        query.orderBy('tmpl.id', 'DESC');
        return query.getMany();
    }

    async findOne(id: number): Promise<RecetaPredisenada> {
        const found = await this.repository.findOne({
            where: { id },
            relations: ['detalles']
        });
        if (!found) {
            throw new NotFoundException(`Receta pre-diseñada con ID ${id} no encontrada`);
        }
        return found;
    }

    async create(data: any): Promise<RecetaPredisenada> {
        const { detalles, ...tmplData } = data;
        const newTemplate = this.repository.create(tmplData as Partial<RecetaPredisenada>);
        const saved = await this.repository.save(newTemplate);

        if (detalles && Array.isArray(detalles) && detalles.length > 0) {
            const detalleEntities = detalles.map((d: any) => 
                this.detalleRepository.create({
                    recetaPredisenadaId: saved.id,
                    medicamento: d.medicamento,
                    cantidad: d.cantidad,
                    indicacion: d.indicacion
                })
            );
            await this.detalleRepository.save(detalleEntities);
        }

        return this.findOne(saved.id);
    }

    async update(id: number, data: any): Promise<RecetaPredisenada> {
        const template = await this.findOne(id);
        const { detalles, ...tmplData } = data;

        Object.assign(template, tmplData);
        await this.repository.save(template);

        if (detalles && Array.isArray(detalles)) {
            await this.detalleRepository.delete({ recetaPredisenadaId: id });
            const detalleEntities = detalles.map((d: any) => 
                this.detalleRepository.create({
                    recetaPredisenadaId: id,
                    medicamento: d.medicamento,
                    cantidad: d.cantidad,
                    indicacion: d.indicacion
                })
            );
            await this.detalleRepository.save(detalleEntities);
        }

        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const template = await this.findOne(id);
        await this.repository.remove(template);
    }
}
