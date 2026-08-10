import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GastosFijos } from '../../gastos_fijos/entities/gastos_fijos.entity';
import { FormaPago } from '../../forma_pago/entities/forma_pago.entity';

@Entity('pagos_gastos_fijos')
export class PagosGastosFijos {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column({ name: 'gasto_fijo_id', nullable: true })
    gastoFijoId: number | null;

    @ManyToOne(() => GastosFijos, { nullable: true })
    @JoinColumn({ name: 'gasto_fijo_id' })
    gastoFijo: GastosFijos;

    @Column({ type: 'date' })
    fecha: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    monto: number;

    @Column({ default: 'BOLIVIANOS' })
    moneda: string; // 'BOLIVIANOS' | 'DOLARES'

    @Column({ name: 'forma_pago_id', nullable: true })
    formaPagoId: number | null;

    @ManyToOne(() => FormaPago, { nullable: true })
    @JoinColumn({ name: 'forma_pago_id' })
    formaPago: FormaPago;

    @Column({ type: 'text', nullable: true })
    observaciones: string;
}
