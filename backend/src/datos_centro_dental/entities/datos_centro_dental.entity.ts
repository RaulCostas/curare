import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('datos_centro_dental')
export class DatosCentroDental {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text' })
  direccion: string;

  @Column({ type: 'text', nullable: true })
  latitud: string;

  @Column({ type: 'text', nullable: true })
  longitud: string;

  @Column({ type: 'text' })
  telefono: string;

  @Column({ type: 'text' })
  celular: string;

  @Column({ type: 'text' })
  emergencias: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  qr: string;

  @Column({ type: 'text', default: 'activo' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  horarios: string;
}
