import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Paciente } from './paciente.entity';
import { Television } from '../../television/entities/television.entity';

@Entity('paciente_television')
export class PacienteTelevision {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    pacienteId: number;

    @Column()
    televisionId: number;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @ManyToOne(() => Television)
    @JoinColumn({ name: 'televisionId' })
    television: Television;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}
