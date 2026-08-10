import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFormaPagoDto } from './dto/create-forma_pago.dto';
import { UpdateFormaPagoDto } from './dto/update-forma_pago.dto';
import { FormaPago } from './entities/forma_pago.entity';

@Injectable()
export class FormaPagoService {
    constructor(
        @InjectRepository(FormaPago)
        private formaPagoRepository: Repository<FormaPago>,
    ) { }

    create(createFormaPagoDto: CreateFormaPagoDto) {
        const formaPago = this.formaPagoRepository.create(createFormaPagoDto);
        return this.formaPagoRepository.save(formaPago);
    }

    async findAll(search?: string, page: number = 1, limit: number = 5): Promise<{
        data: FormaPago[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;
        const queryBuilder = this.formaPagoRepository.createQueryBuilder('formaPago');

        if (search) {
            queryBuilder.where('formaPago.forma_pago ILIKE :search', { search: `%${search}%` });
        }

        const [data, total] = await queryBuilder
            .orderBy('formaPago.forma_pago', 'ASC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    findOne(id: number) {
        return this.formaPagoRepository.findOneBy({ id });
    }

    update(id: number, updateFormaPagoDto: UpdateFormaPagoDto) {
        return this.formaPagoRepository.update(id, updateFormaPagoDto);
    }

    remove(id: number) {
        return this.formaPagoRepository.delete(id);
    }
}
