import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RecetaPredisenada } from './receta_predisenada.entity';

@Entity('receta_predisenada_detalles')
export class RecetaPredisenadaDetalle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'recetaPredisenadaId' })
    recetaPredisenadaId: number;

    @ManyToOne(() => RecetaPredisenada, (receta) => receta.detalles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recetaPredisenadaId' })
    recetaPredisenada: RecetaPredisenada;

    @Column({ type: 'varchar', length: 255 })
    medicamento: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    cantidad: string;

    @Column({ type: 'text', nullable: true })
    indicacion: string;
}
