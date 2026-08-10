import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Proforma } from '../../proformas/entities/proforma.entity';

@Entity('secuencia_tratamiento')
export class SecuenciaTratamiento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column()
    pacienteId: number;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente;

    @Column({ nullable: true })
    proformaId: number | null;

    @ManyToOne(() => Proforma)
    @JoinColumn({ name: 'proformaId' })
    proforma: Proforma;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    fecha: string;

    @Column({ type: 'text', nullable: true })
    periodoncia: string;

    @Column({ type: 'text', nullable: true })
    cirugia: string;

    @Column({ type: 'text', nullable: true })
    endodoncia: string;

    @Column({ type: 'text', nullable: true })
    operatoria: string;

    @Column({ type: 'text', nullable: true })
    protesis: string;

    @Column({ type: 'text', nullable: true })
    implantes: string;

    @Column({ type: 'text', nullable: true })
    ortodoncia: string;

    @Column({ type: 'text', nullable: true })
    odontopediatria: string;
}
