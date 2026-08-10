import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentimientoPaciente } from './entities/consentimiento-paciente.entity';
import { CreateConsentimientoPacienteDto, UpdateConsentimientoPacienteDto } from './dto/consentimiento-paciente.dto';

@Injectable()
export class ConsentimientosPacientesService {
  constructor(
    @InjectRepository(ConsentimientoPaciente)
    private readonly repository: Repository<ConsentimientoPaciente>,
  ) {}

  create(createDto: CreateConsentimientoPacienteDto) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  findAllByPaciente(pacienteId: number) {
    return this.repository.find({
      where: { pacienteId },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const found = await this.repository.findOne({ where: { id }, relations: ['paciente'] });
    if (!found) throw new NotFoundException(`Consentimiento #${id} no encontrado`);
    return found;
  }

  async update(id: number, updateDto: UpdateConsentimientoPacienteDto) {
    const entity = await this.findOne(id);
    this.repository.merge(entity, updateDto);
    return this.repository.save(entity);
  }

  async remove(id: number) {
    const entity = await this.findOne(id);
    return this.repository.remove(entity);
  }
}
