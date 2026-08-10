import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { HistoriaClinica } from '../../historia_clinica/entities/historia_clinica.entity';
import { User } from '../../users/entities/user.entity';
import { MaterialUtilizadoDetalle } from './material_utilizado_detalle.entity';

@Entity('material_utilizado')
export class MaterialUtilizado {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    historiaClinicaId: number;

    @ManyToOne(() => HistoriaClinica)
    @JoinColumn({ name: 'historiaClinicaId' })
    historiaClinica: HistoriaClinica;

    @Column({ type: 'date' })
    fecha: Date;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column()
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => MaterialUtilizadoDetalle, (detalle) => detalle.materialUtilizado, {
        cascade: true,
        eager: true
    })
    detalles: MaterialUtilizadoDetalle[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
