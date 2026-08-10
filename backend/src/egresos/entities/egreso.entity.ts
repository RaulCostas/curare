import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FormaPago } from '../../forma_pago/entities/forma_pago.entity';

@Entity('egresos')
export class Egreso {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column({ type: 'date' })
    fecha: string;

    @Column()
    destino: string; // 'Consultorio' | 'Casa'

    @Column()
    detalle: string;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    monto: number;

    @Column({ default: 'BOLIVIANOS' })
    moneda: string; // 'BOLIVIANOS' | 'DOLARES'

    @Column({ name: 'forma_pago_id', nullable: true })
    formaPagoId: number | null;

    @ManyToOne(() => FormaPago, { eager: true, nullable: true })
    @JoinColumn({ name: 'forma_pago_id' })
    formaPago: FormaPago;
}
