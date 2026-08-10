import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('laboratorios')
export class Laboratorio {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column()
    laboratorio: string;

    @Column({ nullable: true })
    celular: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    banco: string;

    @Column({ name: 'numero_cuenta', nullable: true })
    numero_cuenta: string;

    @Column({ default: 'activo' })
    estado: string;
}
