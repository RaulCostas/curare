import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecuenciaTratamiento } from './entities/secuencia_tratamiento.entity';
import { CreateSecuenciaTratamientoDto, UpdateSecuenciaTratamientoDto } from './dto/create-secuencia_tratamiento.dto';

@Injectable()
export class SecuenciaTratamientoService {
    constructor(
        @InjectRepository(SecuenciaTratamiento)
        private readonly repository: Repository<SecuenciaTratamiento>,
    ) { }

    async create(createDto: CreateSecuenciaTratamientoDto): Promise<SecuenciaTratamiento> {
        const entity = this.repository.create(createDto);
        return this.repository.save(entity);
    }

    async findByProformaId(proformaId: number): Promise<SecuenciaTratamiento[]> {
        return this.repository.find({
            where: { proformaId },
            order: { fecha: 'DESC', id: 'DESC' }
        });
    }

    async checkExists(pacienteId: number, proformaId: number): Promise<boolean> {
        const count = await this.repository.count({
            where: { pacienteId, proformaId }
        });
        return count > 0;
    }

    async update(id: number, updateDto: UpdateSecuenciaTratamientoDto): Promise<SecuenciaTratamiento> {
        await this.repository.update(id, updateDto);
        const updated = await this.repository.findOneBy({ id });
        if (!updated) {
            throw new NotFoundException(`SecuenciaTratamiento with id ${id} not found`);
        }
        return updated;
    }

    async remove(id: number): Promise<void> {
        await this.repository.delete(id);
    }

}
