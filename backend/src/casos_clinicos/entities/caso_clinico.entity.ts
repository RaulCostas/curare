import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Especialidad } from '../../especialidad/entities/especialidad.entity';
import { CasoClinicoFoto } from './caso_clinico_foto.entity';

@Entity('casos_clinicos')
export class CasoClinico {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    nombre: string;

    @Column({ type: 'int' })
    especialidadId: number;

    @ManyToOne(() => Especialidad, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'especialidadId' })
    especialidad: Especialidad;

    @Column({ type: 'text', nullable: true })
    video: string;

    @Column({ type: 'text', default: 'activo' })
    estado: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => CasoClinicoFoto, (foto) => foto.casoClinico, { cascade: true, eager: true })
    fotos: CasoClinicoFoto[];
}
