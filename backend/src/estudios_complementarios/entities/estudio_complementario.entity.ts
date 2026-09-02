import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { User } from '../../users/entities/user.entity';

@Entity('estudios_complementarios')
export class EstudioComplementario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'pacienteId' })
    pacienteId: number;

    @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ type: 'varchar', length: 255 })
    tipo_estudio: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    orden_estudio_url: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    archivo_url: string;

    @Column({ type: 'int', name: 'usuarioId', nullable: true })
    usuarioId: number;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: User;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updatedAt' })
    updatedAt: Date;
}
