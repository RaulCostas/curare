import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Pago } from '../pagos/entities/pago.entity';
import { Egreso } from '../egresos/entities/egreso.entity';
import { PagosDoctores } from '../pagos_doctores/entities/pagos_doctores.entity';
import { PagosPedidos } from '../pagos_pedidos/entities/pagos_pedidos.entity';
import { PagoLaboratorio } from '../pagos_laboratorios/entities/pago-laboratorio.entity';
import { PagosGastosFijos } from '../pagos_gastos_fijos/entities/pagos_gastos_fijos.entity';

@Injectable()
export class UtilidadesService {
    constructor(
        @InjectRepository(Pago) private pagoRepo: Repository<Pago>,
        @InjectRepository(Egreso) private egresoRepo: Repository<Egreso>,
        @InjectRepository(PagosDoctores) private pagosDoctoresRepo: Repository<PagosDoctores>,
        @InjectRepository(PagosPedidos) private pagosPedidosRepo: Repository<PagosPedidos>,
        @InjectRepository(PagoLaboratorio) private pagosLaboratoriosRepo: Repository<PagoLaboratorio>,
        @InjectRepository(PagosGastosFijos) private pagosGastosFijosRepo: Repository<PagosGastosFijos>,
    ) { }

    async getStatistics(year: number) {
        // Initialize 12 months structure
        const stats = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            bolivianos: { ingresos: 0, egresos: 0, utilidad: 0 },
            dolares: { ingresos: 0, egresos: 0, utilidad: 0 },
        }));

        const getMonth = (dateVal: any) => {
            if (!dateVal) return -1;
            if (dateVal instanceof Date) return dateVal.getMonth() + 1;

            // Try parsing string 'YYYY-MM-DD'
            const parts = dateVal.toString().split('-');
            if (parts.length >= 2) return parseInt(parts[1]);

            // Fallback
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) return d.getMonth() + 1;

            return -1;
        };

        const updateStat = (month: number, currency: string, type: 'ingresos' | 'egresos', amount: number) => {
            const index = month - 1;
            if (index >= 0 && index < 12) {
                const currKey = (currency === 'Dólares' || currency === 'USD') ? 'dolares' : 'bolivianos';
                // Handle null/undef amount
                const val = amount ? parseFloat(amount.toString()) : 0;
                stats[index][currKey][type] += val;
            }
        };

        try {
            // 1. INGRESOS (Pagos)
            const pagos = await this.pagoRepo.createQueryBuilder('pago')
                .leftJoinAndSelect('pago.comisionTarjeta', 'comision')
                .where('EXTRACT(YEAR FROM pago.fecha::date) = :year', { year })
                .getMany();

            pagos.forEach(p => {
                let monto = Number(p.monto);
                const descuento = Number(p.monto_comision || 0);
                const montoNeto = monto - descuento;

                updateStat(getMonth(p.fecha), p.moneda, 'ingresos', montoNeto);
            });

            // 2. EGRESOS (General)
            const egresos = await this.egresoRepo.createQueryBuilder('e')
                .where('EXTRACT(YEAR FROM e.fecha) = :year', { year })
                .getMany();

            egresos.forEach(e => {
                updateStat(getMonth(e.fecha), e.moneda, 'egresos', Number(e.monto));
            });

            // 3. EGRESOS (Pagos Doctores)
            const pagosDoctores = await this.pagosDoctoresRepo.createQueryBuilder('pd')
                .where('EXTRACT(YEAR FROM pd.fecha) = :year', { year })
                .getMany();

            pagosDoctores.forEach(pd => {
                updateStat(getMonth(pd.fecha), pd.moneda, 'egresos', Number(pd.total));
            });

            // 4. EGRESOS (Pagos Pedidos)
            const pagosPedidos = await this.pagosPedidosRepo.createQueryBuilder('pp')
                .where('EXTRACT(YEAR FROM pp.fecha::date) = :year', { year })
                .getMany();

            pagosPedidos.forEach(pp => {
                updateStat(getMonth(pp.fecha), pp.moneda || 'Bolivianos', 'egresos', Number(pp.monto));
            });

            // 5. EGRESOS (Pagos Laboratorios)
            const pagosLaboratorios = await this.pagosLaboratoriosRepo.createQueryBuilder('pl')
                .leftJoinAndSelect('pl.trabajoLaboratorio', 'tl')
                .where('EXTRACT(YEAR FROM pl.fecha::date) = :year', { year })
                .getMany();

            pagosLaboratorios.forEach(pl => {
                updateStat(getMonth(pl.fecha), pl.moneda || 'Bolivianos', 'egresos', Number(pl.monto));
            });

            // 6. EGRESOS (Pagos Gastos Fijos)
            const pagosGastosFijos = await this.pagosGastosFijosRepo.createQueryBuilder('pgf')
                .where('EXTRACT(YEAR FROM pgf.fecha::date) = :year', { year })
                .getMany();

            pagosGastosFijos.forEach(pgf => {
                updateStat(getMonth(pgf.fecha), pgf.moneda, 'egresos', Number(pgf.monto));
            });

            // Calculate Utilidad
            stats.forEach(s => {
                s.bolivianos.utilidad = s.bolivianos.ingresos - s.bolivianos.egresos;
                s.dolares.utilidad = s.dolares.ingresos - s.dolares.egresos;
            });

        } catch (error) {
            console.error("Error calculating statistics:", error);
            // Return existing stats (likely zeros) instead of crashing
        }

        return stats;
    }
}
