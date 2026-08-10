import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Pedidos } from 'src/pedidos/entities/pedidos.entity';

@Entity('proveedores')
export class Proveedor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column()
    proveedor: string;

    @Column({ nullable: true })
    celular: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    nombre_contacto: string;

    @Column({ nullable: true })
    celular_contacto: string;

    @Column({ default: 'activo' })
    estado: string;

    @OneToMany(() => Pedidos, (pedido) => pedido.proveedor)
    pedidos: Pedidos[];
}
