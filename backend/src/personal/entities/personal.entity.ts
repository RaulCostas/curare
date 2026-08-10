import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PersonalTipo } from '../../personal_tipo/entities/personal_tipo.entity';

@Entity('personal')
export class Personal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    paterno: string;

    @Column({ nullable: true })
    materno: string;

    @Column()
    nombre: string;

    @Column({ nullable: true })
    ci: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({ nullable: true })
    celular: string;

    @Column({ type: 'date', nullable: true })
    fecha_nacimiento: Date;

    @Column({ type: 'date', nullable: true })
    fecha_ingreso: Date;

    @Column({ nullable: true })
    personal_tipo_id: number;

    @ManyToOne(() => PersonalTipo, { eager: true })
    @JoinColumn({ name: 'personal_tipo_id' })
    personalTipo: PersonalTipo;

    @Column({ default: 'activo' })
    estado: string;

    @Column({ type: 'date', nullable: true })
    fecha_baja: Date;
}
