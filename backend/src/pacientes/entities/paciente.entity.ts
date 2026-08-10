import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CategoriaPaciente } from '../../categoria_paciente/entities/categoria_paciente.entity';
import { FichaMedica } from '../../ficha_medica/entities/ficha_medica.entity';
import { HistoriaClinica } from '../../historia_clinica/entities/historia_clinica.entity';
// import { SecuenciaTratamiento } from '../../secuencia_tratamiento/entities/secuencia_tratamiento.entity';

@Entity('pacientes')
export class Paciente {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    fecha: string;

    @Column({ nullable: true })
    access_id: string;

    @Column()
    paterno: string;

    @Column()
    materno: string;

    @Column()
    nombre: string;

    @Column()
    direccion: string;

    @Column()
    telefono: string;

    @Column()
    celular: string;

    @Column()
    email: string;

    @Column()
    casilla: string;

    @Column()
    profesion: string;

    @Column()
    estado_civil: string;

    @Column()
    direccion_oficina: string;

    @Column()
    telefono_oficina: string;

    @Column({ type: 'date' })
    fecha_nacimiento: string;

    @Column()
    sexo: string;

    @Column()
    seguro_medico: string;

    @Column()
    poliza: string;

    @Column()
    recomendado: string;

    @Column()
    responsable: string;

    @Column()
    parentesco: string;

    @Column()
    direccion_responsable: string;

    @Column()
    telefono_responsable: string;

    @Column({ nullable: true })
    idCategoria: number;

    @ManyToOne(() => CategoriaPaciente, (categoria) => categoria.pacientes, { eager: true, nullable: true })
    @JoinColumn({ name: 'idCategoria' })
    categoria: CategoriaPaciente;

    @OneToOne(() => FichaMedica, (ficha) => ficha.paciente, { cascade: true, eager: true })
    @JoinColumn()
    fichaMedica: FichaMedica;

    @Column({ nullable: true })
    nomenclatura: string;

    @Column({ nullable: true })
    tipo_paciente: string;

    @Column({ nullable: true })
    motivo: string;

    @Column({ default: 'activo' })
    estado: string;

    @OneToMany(() => HistoriaClinica, (historia) => historia.paciente)
    historiaClinica: HistoriaClinica[];

    // @OneToMany(() => SecuenciaTratamiento, (secuencia) => secuencia.paciente)
    // secuenciasTratamiento: SecuenciaTratamiento[];

    @OneToMany('Propuesta', (propuesta: any) => propuesta.paciente)
    propuestas: any[];

    @Column({ type: 'text', nullable: true })
    foto: string;

    @Column({ type: 'text', nullable: true })
    firmaFC: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
