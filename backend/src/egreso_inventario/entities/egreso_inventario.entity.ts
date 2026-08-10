import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Inventario } from '../../inventario/entities/inventario.entity';

@Entity('egresos_inventario')
export class EgresoInventario {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Inventario, (inventario) => inventario.egresosInventario)
    @JoinColumn({ name: 'inventarioId' })
    inventario: Inventario;

    @Column()
    inventarioId: number;

    @Column({ type: 'date' })
    fecha: string;

    @Column('int')
    cantidad: number;

    @Column()
    consultorio: string;

    @Column()
    fecha_vencimiento: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
