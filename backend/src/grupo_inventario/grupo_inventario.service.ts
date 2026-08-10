import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGrupoInventarioDto } from './dto/create-grupo_inventario.dto';
import { UpdateGrupoInventarioDto } from './dto/update-grupo_inventario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { GrupoInventario } from './entities/grupo_inventario.entity';
import { Repository, Like } from 'typeorm';

@Injectable()
export class GrupoInventarioService {
  constructor(
    @InjectRepository(GrupoInventario)
    private readonly grupoInventarioRepository: Repository<GrupoInventario>,
  ) { }

  create(createGrupoInventarioDto: CreateGrupoInventarioDto) {
    const grupo = this.grupoInventarioRepository.create(createGrupoInventarioDto);
    return this.grupoInventarioRepository.save(grupo);
  }

  async findAll(search?: string, page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;
    const whereCondition = search ? [
      { grupo: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.grupoInventarioRepository.findAndCount({
      where: whereCondition,
      take: limit,
      skip: skip,
      order: { id: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const grupo = await this.grupoInventarioRepository.findOneBy({ id });
    if (!grupo) throw new NotFoundException(`Grupo con ID ${id} no encontrado`);
    return grupo;
  }

  async update(id: number, updateGrupoInventarioDto: UpdateGrupoInventarioDto) {
    const grupo = await this.findOne(id);
    this.grupoInventarioRepository.merge(grupo, updateGrupoInventarioDto);
    return this.grupoInventarioRepository.save(grupo);
  }

  async remove(id: number) {
    const grupo = await this.findOne(id);
    return this.grupoInventarioRepository.remove(grupo);
  }
}
