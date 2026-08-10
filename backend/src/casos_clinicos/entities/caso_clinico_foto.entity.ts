import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CasoClinico } from './caso_clinico.entity';

@Entity('casos_clinicos_fotos')
export class CasoClinicoFoto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    casoClinicoId: number;

    @ManyToOne(() => CasoClinico, (caso) => caso.fotos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'casoClinicoId' })
    casoClinico: CasoClinico;

    @Column({ type: 'text' })
    foto: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;
}
