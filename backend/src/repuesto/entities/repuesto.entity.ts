import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('repuestos')
export class Repuesto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date', nullable: true })
    fecha: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    consultorio: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'text', nullable: true })
    motivo: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    costo: number;

    @Column({ name: 'mano_obra', type: 'decimal', precision: 12, scale: 2, default: 0 })
    manoObra: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
