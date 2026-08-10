import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MaterialUtilizado } from './material_utilizado.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';

@Entity('material_utilizado_detalle')
export class MaterialUtilizadoDetalle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    materialUtilizadoId: number;

    @ManyToOne(() => MaterialUtilizado, (mu) => mu.detalles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'materialUtilizadoId' })
    materialUtilizado: MaterialUtilizado;

    @Column()
    inventarioId: number;

    @ManyToOne(() => Inventario)
    @JoinColumn({ name: 'inventarioId' })
    inventario: Inventario;

    @Column()
    cantidad: string; // Allows fractional values like "1/4", "1/2", "1", "2", etc.

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
