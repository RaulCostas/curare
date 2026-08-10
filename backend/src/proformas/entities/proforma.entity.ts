import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, OneToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { User } from '../../users/entities/user.entity';
import { ProformaDetalle } from './proforma-detalle.entity';
import { ProformaImagen } from './proforma-imagen.entity';
import { Pago } from '../../pagos/entities/pago.entity';
import { RecordatorioPlan } from '../../recordatorio_plan/entities/recordatorio-plan.entity';
// import { SecuenciaTratamiento } from '../../secuencia_tratamiento/entities/secuencia_tratamiento.entity';

@Entity('proformas')
export class Proforma {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ nullable: true })
    pacienteId: number;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Column()
    numero: number;

    @Index()
    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    fecha: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    total: number;

    @Column({ type: 'text', nullable: true })
    nota: string;

    @Column({ nullable: true })
    usuarioId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'usuarioId' })
    usuario: User;

    @Column({ default: false })
    aprobado: boolean;

    @Column({ type: 'date', nullable: true })
    fecha_aprobado: string | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'usuario_aprobado' })
    usuarioAprobado: User | null;

    @OneToMany(() => ProformaDetalle, (detalle) => detalle.proforma, { cascade: true })
    detalles: ProformaDetalle[];

    @OneToMany(() => ProformaImagen, (imagen) => imagen.proforma, { cascade: true })
    imagenes: ProformaImagen[];

    @OneToMany(() => Pago, (pago) => pago.proforma)
    pagos: Pago[];

    @OneToMany(() => RecordatorioPlan, (recordatorio) => recordatorio.proforma)
    recordatorios: RecordatorioPlan[];

    // @OneToOne(() => SecuenciaTratamiento, (secuencia) => secuencia.proforma)
    // secuenciaTratamiento: SecuenciaTratamiento;

    @Column({ type: 'text', nullable: true })
    firma: string;

    @Column({ default: false })
    traspasado: boolean;

    @Column({ type: 'text', nullable: true })
    traspaso_observacion: string;

    @Column({ default: false })
    deuda_observada: boolean;

    @Column({ type: 'text', nullable: true })
    deuda_observada_observacion: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

