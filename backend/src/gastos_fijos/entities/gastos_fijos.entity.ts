import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('gastos_fijos')
export class GastosFijos {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column({ nullable: true })
    destino: string;

    @Column({ type: 'int', default: 1 })
    dia: number;

    @Column({ default: false })
    anual: boolean;

    @Column({ nullable: true })
    mes: string;

    @Column()
    gasto_fijo: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    monto: number;

    @Column({ default: 'BOLIVIANOS' })
    moneda: string;

    @Column({ default: 'activo' })
    estado: string;
}
