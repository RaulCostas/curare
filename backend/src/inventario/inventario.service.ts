import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { PedidosDetalle } from '../pedidos/entities/pedidos-detalle.entity';
import { CreateInventarioDto, UpdateInventarioDto } from './dto/create-inventario.dto';

@Injectable()
export class InventarioService {
    constructor(
        @InjectRepository(Inventario)
        private inventarioRepository: Repository<Inventario>,
    ) { }

    create(createInventarioDto: CreateInventarioDto) {
        const inventario = this.inventarioRepository.create(createInventarioDto);
        return this.inventarioRepository.save(inventario);
    }

    async findAll(search?: string, page: number = 1, limit: number = 10, expirationStatus?: string) {
        const queryBuilder = this.inventarioRepository.createQueryBuilder('inventario')
            .leftJoinAndSelect('inventario.especialidad', 'especialidad')
            .leftJoinAndSelect('inventario.grupoInventario', 'grupoInventario');

        if (search) {
            queryBuilder.andWhere('inventario.descripcion ILIKE :search', { search: `%${search}%` });
        }

        if (expirationStatus) {
            const today = new Date().toISOString().split('T')[0];
            let dateCondition = "";
            let params = {};

            if (expirationStatus === '3months') {
                dateCondition = "pd.fecha_vencimiento >= :today AND pd.fecha_vencimiento <= :futureDate";
                params = { today, futureDate: this.getDateAfterMonths(3) };
            } else if (expirationStatus === '6months') {
                dateCondition = "pd.fecha_vencimiento >= :today AND pd.fecha_vencimiento <= :futureDate";
                params = { today, futureDate: this.getDateAfterMonths(6) };
            } else if (expirationStatus === '9months') {
                dateCondition = "pd.fecha_vencimiento >= :today AND pd.fecha_vencimiento <= :futureDate";
                params = { today, futureDate: this.getDateAfterMonths(9) };
            } else if (expirationStatus === 'expired') {
                dateCondition = "pd.fecha_vencimiento < :today";
                params = { today };
            }

            if (dateCondition) {
                queryBuilder.andWhere((qb) => {
                    const subQuery = qb.subQuery()
                        .select("1")
                        .from(PedidosDetalle, "pd")
                        .where("pd.idinventario = inventario.id")
                        .andWhere(dateCondition, params)
                        .getQuery();
                    return "EXISTS " + subQuery;
                });
            }
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
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

    private getDateAfterMonths(months: number): string {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        return date.toISOString().split('T')[0];
    }

    async findLowStock() {
        return this.inventarioRepository.createQueryBuilder('inventario')
            .leftJoinAndSelect('inventario.especialidad', 'especialidad')
            .leftJoinAndSelect('inventario.grupoInventario', 'grupoInventario')
            .where('inventario.cantidad_existente < inventario.stock_minimo')
            .andWhere('inventario.estado = :estado', { estado: 'Activo' }) // Optional: Only active items
            .getMany();
    }

    findOne(id: number) {
        return this.inventarioRepository.findOne({
            where: { id },
            relations: ['especialidad', 'grupoInventario'],
        });
    }

    update(id: number, updateInventarioDto: UpdateInventarioDto) {
        return this.inventarioRepository.update(id, updateInventarioDto);
    }

    remove(id: number) {
        return this.inventarioRepository.delete(id);
    }
    async findExpiringDetails(expirationStatus: string) {
        const queryBuilder = this.inventarioRepository.manager.createQueryBuilder(PedidosDetalle, 'pd')
            .leftJoinAndSelect('pd.inventario', 'inventario')
            .leftJoinAndSelect('inventario.especialidad', 'especialidad')
            .leftJoinAndSelect('inventario.grupoInventario', 'grupoInventario');

        const today = new Date().toISOString().split('T')[0];

        if (expirationStatus === '3months') {
            queryBuilder.where(
                "pd.fecha_vencimiento >= :today AND pd.fecha_vencimiento <= :threeMonths",
                { today, threeMonths: this.getDateAfterMonths(3) }
            );
        } else if (expirationStatus === '6months') {
            queryBuilder.where(
                "pd.fecha_vencimiento > :threeMonths AND pd.fecha_vencimiento <= :sixMonths",
                { threeMonths: this.getDateAfterMonths(3), sixMonths: this.getDateAfterMonths(6) }
            );
        } else if (expirationStatus === '9months') {
            queryBuilder.where(
                "pd.fecha_vencimiento > :sixMonths AND pd.fecha_vencimiento <= :nineMonths",
                { sixMonths: this.getDateAfterMonths(6), nineMonths: this.getDateAfterMonths(9) }
            );
        } else if (expirationStatus === 'expired') {
            queryBuilder.where("pd.fecha_vencimiento < :today", { today });
        }

        return queryBuilder.getMany();
    }
}
