import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComisionTarjeta } from './entities/comision_tarjeta.entity';
import { CreateComisionTarjetaDto } from './dto/create-comision_tarjeta.dto';
import { UpdateComisionTarjetaDto } from './dto/update-comision_tarjeta.dto';

@Injectable()
export class ComisionTarjetaService {
    constructor(
        @InjectRepository(ComisionTarjeta)
        private comisionTarjetaRepository: Repository<ComisionTarjeta>,
    ) { }

    create(createComisionTarjetaDto: CreateComisionTarjetaDto) {
        const comision = this.comisionTarjetaRepository.create(createComisionTarjetaDto);
        return this.comisionTarjetaRepository.save(comision);
    }

    findAll() {
        return this.comisionTarjetaRepository.find();
    }

    findOne(id: number) {
        return this.comisionTarjetaRepository.findOneBy({ id });
    }

    update(id: number, updateComisionTarjetaDto: UpdateComisionTarjetaDto) {
        return this.comisionTarjetaRepository.update(id, updateComisionTarjetaDto);
    }

    remove(id: number) {
        return this.comisionTarjetaRepository.delete(id);
    }
}
