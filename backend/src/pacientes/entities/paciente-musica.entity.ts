import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Paciente } from './paciente.entity';
import { Musica } from '../../musica/entities/musica.entity';

@Entity('paciente_musica')
export class PacienteMusica {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    pacienteId: number;

    @Column()
    musicaId: number;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @ManyToOne(() => Musica)
    @JoinColumn({ name: 'musicaId' })
    musica: Musica;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}
