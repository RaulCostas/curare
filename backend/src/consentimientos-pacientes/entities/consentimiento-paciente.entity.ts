import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('consentimiento_pacientes')
export class ConsentimientoPaciente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  pacienteId: number;

  @ManyToOne(() => Paciente, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pacienteId' })
  paciente: Paciente;

  @Column()
  titulo: string;

  @Column('text')
  contenido_generado: string;

  @CreateDateColumn()
  fecha: Date;
}
