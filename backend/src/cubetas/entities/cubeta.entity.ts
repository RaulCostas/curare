import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cubetas')
export class Cubeta {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column()
    codigo: string;

    @Column({ nullable: true })
    descripcion: string;

    @Column({ nullable: true })
    dentro_fuera: string; // 'dentro' | 'fuera'

    @Column({ default: 'activo' })
    estado: string; // 'activo'
}
