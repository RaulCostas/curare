import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { TrabajoLaboratorio } from '../../trabajos_laboratorios/entities/trabajo_laboratorio.entity';
import { FormaPago } from '../../forma_pago/entities/forma_pago.entity';

@Entity('pagos_laboratorios')
export class PagoLaboratorio {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ nullable: true })
    idTrabajos_Laboratorios: number | null;

    @ManyToOne(() => TrabajoLaboratorio, { nullable: true })
    @JoinColumn({ name: 'idTrabajos_Laboratorios' })
    trabajoLaboratorio: TrabajoLaboratorio;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    monto: number;

    @Column({ default: 'BOLIVIANOS' })
    moneda: string;

    @Column({ nullable: true })
    idforma_pago: number | null;

    @ManyToOne(() => FormaPago, { nullable: true })
    @JoinColumn({ name: 'idforma_pago' })
    formaPago: FormaPago;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 6.96 })
    tc: number;

    @Column({ nullable: true })
    recibo: string;

    @Column({ nullable: true })
    banco: string;
}
