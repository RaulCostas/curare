import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Proforma } from '../../proformas/entities/proforma.entity';
import { ComisionTarjeta } from '../../comision_tarjeta/entities/comision_tarjeta.entity';
import { FormaPago } from '../../forma_pago/entities/forma_pago.entity';

@Entity('pagos')
export class Pago {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    pacienteId: number;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Index()
    @Column({ type: 'date' })
    fecha: string;

    @Index()
    @Column({ nullable: true })
    proformaId: number;

    @ManyToOne(() => Proforma)
    @JoinColumn({ name: 'proformaId' })
    proforma: Proforma;

    @Column('decimal', { precision: 10, scale: 2 })
    monto: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    monto_comision: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    tc: number;

    @Column({ nullable: true })
    recibo: string;

    @Column({ nullable: true })
    factura: string;

    @Column({ nullable: true })
    access_id: string;

    @Column({ nullable: true })
    comisionTarjetaId: number;

    @ManyToOne(() => ComisionTarjeta)
    @JoinColumn({ name: 'comisionTarjetaId' })
    comisionTarjeta: ComisionTarjeta;

    @Column({ nullable: true })
    formaPagoId: number;

    @ManyToOne(() => FormaPago)
    @JoinColumn({ name: 'formaPagoId' })
    formaPagoRel: FormaPago;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({
        type: 'enum',
        enum: ['Bolivianos', 'Dólares'],
        default: 'Bolivianos'
    })
    moneda: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
