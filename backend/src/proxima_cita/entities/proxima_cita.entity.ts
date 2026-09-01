import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Proforma } from '../../proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../proformas/entities/proforma-detalle.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

@Entity('proxima_cita')
export class ProximaCita {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column({ name: 'paciente_id' })
    pacienteId: number;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;

    @Column({ name: 'proforma_id', nullable: true })
    proformaId: number | null;

    @ManyToOne(() => Proforma)
    @JoinColumn({ name: 'proforma_id' })
    proforma: Proforma;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ nullable: true })
    pieza: string;

    @Column({ name: 'proforma_detalle_id', nullable: true })
    proformaDetalleId: number | null;

    @ManyToOne(() => ProformaDetalle, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'proforma_detalle_id' })
    proformaDetalle: ProformaDetalle;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ name: 'doctor_id', nullable: true })
    doctorId: number | null;

    @ManyToOne(() => Doctor)
    @JoinColumn({ name: 'doctor_id' })
    doctor: Doctor;

    @Column({ default: 'pendiente' })
    estado: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
