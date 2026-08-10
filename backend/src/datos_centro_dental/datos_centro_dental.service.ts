import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDatosCentroDentalDto } from './dto/create-datos-centro-dental.dto';
import { UpdateDatosCentroDentalDto } from './dto/update-datos-centro-dental.dto';
import { DatosCentroDental } from './entities/datos_centro_dental.entity';

@Injectable()
export class DatosCentroDentalService {
  constructor(
    @InjectRepository(DatosCentroDental)
    private readonly repository: Repository<DatosCentroDental>,
  ) {}

  create(createDto: CreateDatosCentroDentalDto) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  findAll() {
    return this.repository.find();
  }

  findOne(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateDatosCentroDentalDto) {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException(`DatosCentroDental #${id} not found`);
    this.repository.merge(entity, updateDto);
    return this.repository.save(entity);
  }

  async remove(id: number) {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException(`DatosCentroDental #${id} not found`);
    return this.repository.remove(entity);
  }

  async updateQr(id: number, filename: string) {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException(`DatosCentroDental #${id} not found`);
    entity.qr = filename;
    return this.repository.save(entity);
  }
}
