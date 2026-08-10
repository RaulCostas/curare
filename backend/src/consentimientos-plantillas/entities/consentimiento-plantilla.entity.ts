import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Especialidad } from '../../especialidad/entities/especialidad.entity';

@Entity('consentimiento_plantillas')
export class ConsentimientoPlantilla {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column('text')
  contenido: string;

  @Column({ name: 'especialidad_id', nullable: true })
  especialidadId: number;

  @ManyToOne(() => Especialidad, { eager: true, nullable: true })
  @JoinColumn({ name: 'especialidad_id' })
  especialidad: Especialidad;

  @Column({ default: 'activo' })
  estado: string;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
