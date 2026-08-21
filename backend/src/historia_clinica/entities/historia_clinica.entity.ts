import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Especialidad } from '../../especialidad/entities/especialidad.entity';
import { Proforma } from '../../proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../proformas/entities/proforma-detalle.entity';
import { PagosDetalleDoctores } from '../../pagos_doctores/entities/pagos-detalle-doctores.entity';
import { Personal } from '../../personal/entities/personal.entity';

@Entity('historia_clinica')
export class HistoriaClinica {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    access_id: string;

    @Column({ nullable: true })
    access_plan_pagos_id: string;

    @Column({ nullable: true })
    access_trabajos_doctores_id: string;

    @Index()
    @Column()
    pacienteId: number;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Index()
    @Column({ type: 'date' })
    fecha: Date;

    @Column({ nullable: true })
    pieza: string;

    @Column({ type: 'int', default: 1 })
    cantidad: number;

    @Column({ nullable: true })
    proformaDetalleId: number;

    @ManyToOne(() => ProformaDetalle, { nullable: true })
    @JoinColumn({ name: 'proformaDetalleId' })
    proformaDetalle: ProformaDetalle;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ nullable: true })
    especialidadId: number;

    @ManyToOne(() => Especialidad, { nullable: true })
    @JoinColumn({ name: 'especialidadId' })
    especialidad: Especialidad;

    @Index()
    @Column({ nullable: true })
    doctorId: number;

    @ManyToOne(() => Doctor, { nullable: true })
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column({ nullable: true })
    personalId: number;

    @ManyToOne(() => Personal, { nullable: true, eager: true })
    @JoinColumn({ name: 'personalId' })
    personal: Personal;

    @Column({ type: 'int', default: 0 })
    hoja: number;

    @Column({ default: 'no terminado' })
    estadoTratamiento: string; // 'terminado' | 'no terminado'

    @Column({ default: 'no terminado' })
    estadoPresupuesto: string; // 'terminado' | 'no terminado'

    @Index()
    @Column({ nullable: true })
    proformaId: number;

    @ManyToOne(() => Proforma, { nullable: true })
    @JoinColumn({ name: 'proformaId' })
    proforma: Proforma;

    @Column({ nullable: true })
    tratamiento: string;

    @Column({ default: false, name: 'Resaltar' })
    resaltar: boolean;

    @Column({ default: false, name: 'Caso_Clinico' })
    casoClinico: boolean;

    @Column({ default: false })
    control: boolean;

    @Column({ default: 'NO' })
    pagado: string; // 'SI' | 'NO'

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    precio: number;

    @OneToMany(() => PagosDetalleDoctores, (detalle) => detalle.historiaClinica)
    pagosDetalleDoctores: PagosDetalleDoctores[];

    @Column({ type: 'text', nullable: true })
    firmaPaciente: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
