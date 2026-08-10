import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Informe } from './entities/informe.entity';
import { CreateInformeDto, UpdateInformeDto } from './dto/informe.dto';

@Injectable()
export class InformesService {
    constructor(
        @InjectRepository(Informe)
        private informesRepository: Repository<Informe>,
    ) {}

    create(createInformeDto: CreateInformeDto) {
        const informe = this.informesRepository.create(createInformeDto);
        return this.informesRepository.save(informe);
    }

    findAll() {
        return this.informesRepository.find({
            relations: ['paciente', 'user'],
            order: { fecha: 'DESC' }
        });
    }

    findByPaciente(pacienteId: number) {
        return this.informesRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'user'],
            order: { fecha: 'DESC' }
        });
    }

    async findOne(id: number) {
        const informe = await this.informesRepository.findOne({
            where: { id },
            relations: ['paciente', 'user']
        });
        if (!informe) {
            throw new NotFoundException(`Informe con id ${id} no encontrado`);
        }
        return informe;
    }

    async update(id: number, updateInformeDto: UpdateInformeDto) {
        const informe = await this.findOne(id);
        Object.assign(informe, updateInformeDto);
        return this.informesRepository.save(informe);
    }

    async remove(id: number) {
        const informe = await this.findOne(id);
        return this.informesRepository.remove(informe);
    }
}
