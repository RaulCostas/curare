import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Especialidad } from '../../especialidad/entities/especialidad.entity';

@Entity()
export class Doctor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    access_id: string;

    @Column()
    paterno: string;

    @Column({ nullable: true })
    materno: string;

    @Column()
    nombre: string;

    @Column({ nullable: true })
    celular: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ default: 'activo' })
    estado: string;

    @Column({ nullable: true })
    idEspecialidad: number;

    @ManyToOne(() => Especialidad)
    @JoinColumn({ name: 'idEspecialidad' })
    especialidad: Especialidad;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
