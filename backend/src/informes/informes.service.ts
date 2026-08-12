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

    async create(createInformeDto: CreateInformeDto) {
        const informe = this.informesRepository.create(createInformeDto);
        const saved = await this.informesRepository.save(informe);
        return this.findOne(saved.id);
    }

    findAll() {
        return this.informesRepository.find({
            relations: ['paciente', 'user', 'doctor', 'doctor.especialidad'],
            order: { fecha: 'DESC', id: 'DESC' }
        });
    }

    findByPaciente(pacienteId: number) {
        return this.informesRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'user', 'doctor', 'doctor.especialidad'],
            order: { fecha: 'DESC', id: 'DESC' }
        });
    }

    async findOne(id: number) {
        const informe = await this.informesRepository.findOne({
            where: { id },
            relations: ['paciente', 'user', 'doctor', 'doctor.especialidad']
        });
        if (!informe) {
            throw new NotFoundException(`Informe con id ${id} no encontrado`);
        }
        return informe;
    }

    async update(id: number, updateInformeDto: UpdateInformeDto) {
        const informe = await this.findOne(id);
        Object.assign(informe, updateInformeDto);
        await this.informesRepository.save(informe);
        return this.findOne(id);
    }

    async remove(id: number) {
        const informe = await this.findOne(id);
        return this.informesRepository.remove(informe);
    }
}
