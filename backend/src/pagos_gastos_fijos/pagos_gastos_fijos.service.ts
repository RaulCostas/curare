import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { PagosGastosFijos } from './entities/pagos_gastos_fijos.entity';
import { CreatePagosGastosFijosDto } from './dto/create-pagos_gastos_fijos.dto';

@Injectable()
export class PagosGastosFijosService {
    constructor(
        @InjectRepository(PagosGastosFijos)
        private pagosRepository: Repository<PagosGastosFijos>,
    ) { }

    create(createDto: CreatePagosGastosFijosDto) {
        const pago = this.pagosRepository.create(createDto);
        return this.pagosRepository.save(pago);
    }

    findAll(fecha?: string, startDate?: string, endDate?: string) {
        const options: any = {
            relations: ['gastoFijo', 'formaPago'],
            order: { fecha: 'DESC' }
        };

        const startStr = (startDate || fecha || '').split('T')[0];
        const endStr = (endDate || fecha || '').split('T')[0];

        if (startStr && endStr) {
            options.where = {
                fecha: Between(startStr, endStr)
            };
        }

        return this.pagosRepository.find(options);
    }

    findOne(id: number) {
        return this.pagosRepository.findOne({ where: { id }, relations: ['gastoFijo', 'formaPago'] });
    }

    update(id: number, updateDto: CreatePagosGastosFijosDto) {
        return this.pagosRepository.update(id, updateDto);
    }

    remove(id: number) {
        return this.pagosRepository.delete(id);
    }
}
