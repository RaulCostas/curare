import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RecetaPredisenadaDetalle } from './receta_predisenada_detalle.entity';

@Entity('recetas_predisenadas')
export class RecetaPredisenada {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    nombre: string;

    @Column({ name: 'especialidadId', nullable: true })
    especialidadId: number;

    @Column({ type: 'text', nullable: true })
    diagnostico: string;

    @Column({ type: 'text', nullable: true })
    indicaciones: string;

    @Column({ type: 'varchar', length: 20, default: 'activo' })
    estado: string;

    @OneToMany(() => RecetaPredisenadaDetalle, (detalle) => detalle.recetaPredisenada, { cascade: true, eager: true })
    detalles: RecetaPredisenadaDetalle[];

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
}
