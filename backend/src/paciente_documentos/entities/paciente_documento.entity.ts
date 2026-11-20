import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { DocumentoGeneral } from '../../documentos_generales/entities/documento_general.entity';

@Entity('paciente_documentos')
export class PacienteDocumento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'paciente_id' })
    pacienteId: number;

    @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;

    @Column({ name: 'documento_general_id', nullable: true })
    documentoGeneralId: number | null;

    @ManyToOne(() => DocumentoGeneral, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'documento_general_id' })
    documentoGeneral: DocumentoGeneral | null;

    @Column({ length: 255 })
    titulo: string;

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

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    fecha: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
