import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('categoria_paciente')
export class CategoriaPaciente {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sigla: string;

    @Column()
    descripcion: string;

    @Column()
    color: string;

    @Column({ default: 'activo' })
    estado: string;

    @OneToMany(() => Paciente, (paciente) => paciente.categoria)
    pacientes: Paciente[];
}
