import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('recibos')
export class Recibo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true, type: 'varchar', length: 50 })
    accessId: string;

    @Column({ type: 'date', nullable: true })
    fecha: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    concepto: string;

    @Column({ type: 'varchar', length: 50, default: 'BOLIVIANOS' })
    moneda: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    monto: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
