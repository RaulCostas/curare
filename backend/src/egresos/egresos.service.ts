import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { UpdateEgresoDto } from './dto/update-egreso.dto';
import { Egreso } from './entities/egreso.entity';
import { Recibo } from '../recibo/entities/recibo.entity';

@Injectable()
export class EgresosService {
    constructor(
        @InjectRepository(Egreso)
        private egresosRepository: Repository<Egreso>,
        @InjectRepository(Recibo)
        private recibosRepository: Repository<Recibo>,
    ) { }

    async onModuleInit() {
        // Fix for existing records with null forma_pago_id or missing column
        try {
            await this.egresosRepository.query(`UPDATE egresos SET forma_pago_id = 1 WHERE forma_pago_id IS NULL`);
            await this.egresosRepository.query(`ALTER TABLE egresos ADD COLUMN IF NOT EXISTS recibo_id INTEGER REFERENCES recibos(id) ON DELETE SET NULL`);
        } catch (e) {
            console.log('Skipping egresos alter/update on init, table might not exist yet');
        }
    }

    create(createEgresoDto: CreateEgresoDto) {
        const egreso = this.egresosRepository.create({
            ...createEgresoDto,
            fecha: String(createEgresoDto.fecha),
            formaPagoId: createEgresoDto.formaPagoId
        });
        return this.egresosRepository.save(egreso);
    }

    async findAll(page: number = 1, limit: number = 10, startDate?: string, endDate?: string, search?: string) {
        const skip = (page - 1) * limit;

        const queryBuilder = this.egresosRepository.createQueryBuilder('egreso')
            .leftJoinAndSelect('egreso.formaPago', 'formaPago')
            .leftJoinAndSelect('egreso.recibo', 'recibo')
            .orderBy('egreso.fecha', 'DESC')
            .addOrderBy('egreso.detalle', 'ASC')
            .skip(skip)
            .take(limit);

        const whereCondition: any = {};
        if (search) {
            whereCondition.detalle = ILike(`%${search}%`);
            queryBuilder.andWhere('egreso.detalle ILIKE :search', { search: `%${search}%` });
        }
        if (startDate && endDate) {
            const startStr = startDate.split('T')[0];
            const endStr = endDate.split('T')[0];
            whereCondition.fecha = Between(startStr, endStr);
            queryBuilder.andWhere('egreso.fecha BETWEEN :startStr AND :endStr', { startStr, endStr });
        }

        const [data, total] = await queryBuilder.getManyAndCount();

        // Calculate totals
        let allEgresosForTotals;
        const findOptions: any = { relations: ['formaPago'], where: {} };

        if (search) {
            findOptions.where.detalle = ILike(`%${search}%`);
        }
        if (startDate && endDate) {
            findOptions.where.fecha = Between(startDate, endDate);
        }

        allEgresosForTotals = await this.egresosRepository.find(findOptions);

        // Initialize totals structure with requested keys
        const totals: Record<string, { bolivianos: number; dolares: number }> = {
            'Efectivo': { bolivianos: 0, dolares: 0 },
            'Transferencia': { bolivianos: 0, dolares: 0 },
            'QR': { bolivianos: 0, dolares: 0 },
            'Debito': { bolivianos: 0, dolares: 0 }
        };

        allEgresosForTotals.forEach(egreso => {
            const monto = Number(egreso.monto);
            const monedaKey = (egreso.moneda || '').toUpperCase().includes('DOLAR') ? 'dolares' : 'bolivianos';
            const formaPagoName = egreso.formaPago?.forma_pago || 'Sin Asignar';

            let key = formaPagoName;

            // Normalize keys to match initialized structure
            if (key.toUpperCase() === 'EFECTIVO') key = 'Efectivo';
            else if (key.toUpperCase() === 'QR') key = 'QR';
            else if (key.toUpperCase() === 'DEPOSITO' || key.toUpperCase() === 'DEPÓSITO' || key.toUpperCase() === 'TRANSFERENCIA') key = 'Transferencia';
            else if (key.toUpperCase() === 'DEBITO' || key.toUpperCase() === 'DÉBITO') key = 'Debito';

            if (!totals[key]) {
                totals[key] = { bolivianos: 0, dolares: 0 };
            }
            totals[key][monedaKey] += monto;
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totals
        };
    }

    findOne(id: number) {
        return this.egresosRepository.findOne({
            where: { id },
            relations: ['formaPago', 'recibo']
        });
    }

    update(id: number, updateEgresoDto: UpdateEgresoDto) {
        const payload: any = {
            id,
            ...updateEgresoDto
        };
        if (updateEgresoDto.fecha) payload.fecha = String(updateEgresoDto.fecha);
        return this.egresosRepository.save(payload);
    }

    remove(id: number) {
        return this.egresosRepository.delete(id);
    }

    async generarRecibo(id: number) {
        const egreso = await this.egresosRepository.findOne({
            where: { id },
            relations: ['formaPago', 'recibo']
        });

        if (!egreso) {
            throw new NotFoundException(`Egreso #${id} no encontrado`);
        }

        if (egreso.recibo) {
            return {
                egreso,
                recibo: egreso.recibo,
                message: 'El recibo ya fue generado previamente'
            };
        }

        // Obtener el siguiente número correlativo de accessId (ej. 002363)
        const lastRecibo = await this.recibosRepository
            .createQueryBuilder('r')
            .where("r.accessId ~ '^[0-9]+$'")
            .orderBy('CAST(r.accessId AS INTEGER)', 'DESC')
            .getOne();

        let nextNum = 1;
        if (lastRecibo && lastRecibo.accessId) {
            nextNum = parseInt(lastRecibo.accessId, 10) + 1;
        } else {
            const count = await this.recibosRepository.count();
            nextNum = count + 1;
        }
        const accessId = String(nextNum).padStart(6, '0');

        const nuevoRecibo = this.recibosRepository.create({
            accessId,
            fecha: egreso.fecha,
            nombre: egreso.destino || 'Consultorio',
            concepto: egreso.detalle || 'Egreso registrado',
            moneda: (egreso.moneda || 'BOLIVIANOS').toUpperCase().includes('DOLAR') ? 'DOLARES' : 'BOLIVIANOS',
            monto: Number(egreso.monto) || 0,
        });

        const reciboGuardado = await this.recibosRepository.save(nuevoRecibo);

        egreso.reciboId = reciboGuardado.id;
        egreso.recibo = reciboGuardado;
        await this.egresosRepository.save(egreso);

        return {
            egreso,
            recibo: reciboGuardado,
            message: 'Recibo generado exitosamente'
        };
    }
}
