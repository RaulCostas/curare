import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Proforma } from '../../proformas/entities/proforma.entity';
import { User } from '../../users/entities/user.entity';
import { Personal } from '../../personal/entities/personal.entity';

@Entity('agenda')
export class Agenda {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ type: 'time', nullable: true })
    hora: string;

    @Column({ type: 'int', default: 30 })
    duracion: number; // en minutos

    @Column({ type: 'int', default: 1 })
    consultorio: number; // 1 - 5

    @Column({ nullable: true })
    pacienteId: number | null;

    @ManyToOne(() => Paciente, { nullable: true })
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Column({ nullable: true })
    doctorId: number | null;

    @ManyToOne(() => Doctor, { nullable: true })
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column({ nullable: true })
    proformaId: number | null;

    @ManyToOne(() => Proforma, { nullable: true })
    @JoinColumn({ name: 'proformaId' })
    proforma: Proforma;

    @Column({ type: 'text', nullable: true })
    tratamiento: string;

    @Column({ name: 'personalId', nullable: true })
    personalId: number | null;

    @ManyToOne(() => Personal, { nullable: true })
    @JoinColumn({ name: 'personalId' })
    personal: Personal;

    @Column({ nullable: true })
    usuarioId: number | null; // Quien agendó

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'usuarioId' })
    usuario: User;

    @Column({ name: 'fecha_agendado', type: 'timestamp', nullable: true })
    fechaAgendado: Date | null;

    // Hora agendado is implicitly part of fecha_agendado timestamp, but if specific column needed:
    // We will rely on fechaAgendado being a full timestamp.

    @Column({ default: 'agendado' })
    estado: string;

    @Column({ type: 'text', nullable: true })
    motivoCancelacion: string;

    @UpdateDateColumn()
    updatedAt: Date;
}
