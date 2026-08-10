import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Proforma } from './proforma.entity';
import { Arancel } from '../../arancel/entities/arancel.entity';

@Entity('proforma_detalle')
export class ProformaDetalle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    proformaId: number;

    @ManyToOne(() => Proforma, (proforma) => proforma.detalles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'proformaId' })
    proforma: Proforma;

    @Column({ nullable: true })
    arancelId: number;

    @ManyToOne(() => Arancel)
    @JoinColumn({ name: 'arancelId' })
    arancel: Arancel;

    @Column({ nullable: true })
    precio: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    precioUnitario: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    tc: number;

    @Column({ nullable: true })
    piezas: string;

    @Column()
    cantidad: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    subTotal: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    descuento: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    total: number;

    @Column({ default: false })
    posible: boolean;
}
