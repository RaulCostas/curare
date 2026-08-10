import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Especialidad } from '../../especialidad/entities/especialidad.entity';

@Entity('arancel')
export class Arancel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    codigo: string;

    @Column()
    detalle: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    precio1: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    precio2: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    tc: number;

    @Column({ default: 'activo' })
    estado: string;

    @Column()
    idEspecialidad: number;

    @ManyToOne(() => Especialidad)
    @JoinColumn({ name: 'idEspecialidad' })
    especialidad: Especialidad;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
