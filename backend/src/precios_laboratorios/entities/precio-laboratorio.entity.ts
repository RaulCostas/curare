import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Laboratorio } from '../../laboratorios/entities/laboratorio.entity';

@Entity('precios_laboratorios')
export class PrecioLaboratorio {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column()
    detalle: string;

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number;

    @Column()
    idLaboratorio: number;

    @ManyToOne(() => Laboratorio)
    @JoinColumn({ name: 'idLaboratorio' })
    laboratorio: Laboratorio;

    @Column({ default: 'activo' })
    estado: string;
}
