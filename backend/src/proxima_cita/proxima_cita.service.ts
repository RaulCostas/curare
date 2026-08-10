import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProximaCita } from './entities/proxima_cita.entity';
import { CreateProximaCitaDto } from './dto/create-proxima_cita.dto';
import { UpdateProximaCitaDto } from './dto/update-proxima_cita.dto';

@Injectable()
export class ProximaCitaService {
    constructor(
        @InjectRepository(ProximaCita)
        private readonly proximaCitaRepository: Repository<ProximaCita>,
    ) { }

    async create(createDto: CreateProximaCitaDto): Promise<ProximaCita> {
        const cita = this.proximaCitaRepository.create(createDto);
        return await this.proximaCitaRepository.save(cita);
    }

    async findAll(): Promise<ProximaCita[]> {
        return await this.proximaCitaRepository.find({
            relations: ['paciente', 'doctor', 'proforma', 'proformaDetalle', 'proformaDetalle.arancel'],
            order: { fecha: 'ASC' }
        });
    }

    async findAllByPaciente(pacienteId: number): Promise<ProximaCita[]> {
        return await this.proximaCitaRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'doctor', 'proforma', 'proformaDetalle', 'proformaDetalle.arancel'],
            order: { fecha: 'ASC' }
        });
    }

    async findOne(id: number): Promise<ProximaCita> {
        const cita = await this.proximaCitaRepository.findOne({
            where: { id },
            relations: ['paciente', 'doctor', 'proforma', 'proformaDetalle', 'proformaDetalle.arancel']
        });
        if (!cita) {
            throw new NotFoundException(`Proxima Cita #${id} not found`);
        }
        return cita;
    }

    async update(id: number, updateDto: UpdateProximaCitaDto): Promise<ProximaCita> {
        const cita = await this.findOne(id);
        this.proximaCitaRepository.merge(cita, updateDto);
        return await this.proximaCitaRepository.save(cita);
    }

    async remove(id: number): Promise<void> {
        const result = await this.proximaCitaRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Proxima Cita #${id} not found`);
        }
    }
}
