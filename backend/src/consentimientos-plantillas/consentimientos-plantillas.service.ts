import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentimientoPlantilla } from './entities/consentimiento-plantilla.entity';
import { CreateConsentimientoPlantillaDto, UpdateConsentimientoPlantillaDto } from './dto/consentimiento-plantilla.dto';

@Injectable()
export class ConsentimientosPlantillasService {
  constructor(
    @InjectRepository(ConsentimientoPlantilla)
    private readonly repository: Repository<ConsentimientoPlantilla>,
  ) {}

  create(createDto: CreateConsentimientoPlantillaDto) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  findAll(search?: string) {
    const qb = this.repository.createQueryBuilder('p')
      .leftJoinAndSelect('p.especialidad', 'especialidad')
      .orderBy('p.id', 'DESC');

    if (search) {
      qb.where('LOWER(p.titulo) LIKE LOWER(:search) OR LOWER(p.contenido) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const found = await this.repository.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`Plantilla #${id} no encontrada`);
    return found;
  }

  async update(id: number, updateDto: UpdateConsentimientoPlantillaDto) {
    const entity = await this.findOne(id);
    this.repository.merge(entity, updateDto);
    return this.repository.save(entity);
  }

  async remove(id: number) {
    const entity = await this.findOne(id);
    return this.repository.remove(entity);
  }
}
