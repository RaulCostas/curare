import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGastosFijosDto } from './dto/create-gastos_fijos.dto';
import { UpdateGastosFijosDto } from './dto/update-gastos_fijos.dto';
import { GastosFijos } from './entities/gastos_fijos.entity';

@Injectable()
export class GastosFijosService {
    constructor(
        @InjectRepository(GastosFijos)
        private gastosFijosRepository: Repository<GastosFijos>,
    ) { }

    create(createGastosFijosDto: CreateGastosFijosDto) {
        const gasto = this.gastosFijosRepository.create(createGastosFijosDto);
        return this.gastosFijosRepository.save(gasto);
    }

    findAll() {
        return this.gastosFijosRepository.find();
    }

    async findOne(id: number) {
        const gasto = await this.gastosFijosRepository.findOneBy({ id });
        if (!gasto) {
            throw new NotFoundException(`Gasto Fijo #${id} not found`);
        }
        return gasto;
    }

    async update(id: number, updateGastosFijosDto: UpdateGastosFijosDto) {
        const gasto = await this.findOne(id);
        this.gastosFijosRepository.merge(gasto, updateGastosFijosDto);
        return this.gastosFijosRepository.save(gasto);
    }

    async remove(id: number) {
        const gasto = await this.findOne(id);
        return this.gastosFijosRepository.remove(gasto);
    }
}
