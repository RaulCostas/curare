import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('documentos_generales')
export class DocumentoGeneral {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ length: 255 })
    archivo: string;

    @Column({ name: 'archivo_original', length: 255 })
    archivo_original: string;

    @Column({ type: 'bigint', nullable: true })
    tamano: number;

    @Column({ length: 100, nullable: true })
    mimetype: string;

    @Column({ length: 50, default: 'activo' })
    estado: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
