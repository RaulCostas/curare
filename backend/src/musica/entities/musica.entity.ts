import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('musica')
export class Musica {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255, unique: true })
    musica: string;

    @Column({ length: 20, default: 'activo' })
    estado: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}
