import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { User } from '../../users/entities/user.entity';

@Entity('informes')
export class Informe {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'paciente_id' })
    pacienteId: number;

    @Column({ type: 'int', name: 'user_id', nullable: true })
    userId: number;

    @Column({ type: 'date' })
    fecha: string;

    @Column('text')
    contenido: string;

    @Column({ type: 'boolean', default: false })
    esta_firmado: boolean;

    @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
