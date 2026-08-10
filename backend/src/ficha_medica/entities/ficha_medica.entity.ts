import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('ficha_medica')
export class FichaMedica {
    @PrimaryGeneratedColumn()
    id: number;

    // Enfermedades (Checkboxes)
    @Column({ default: false })
    alergia_anestesicos: boolean;

    @Column({ default: false })
    alergias_drogas: boolean;

    @Column({ default: false })
    hepatitis: boolean;

    @Column({ default: false })
    asma: boolean;

    @Column({ default: false })
    diabetes: boolean;

    @Column({ default: false })
    dolencia_cardiaca: boolean;

    @Column({ default: false })
    hipertension: boolean;

    @Column({ default: false })
    fiebre_reumatica: boolean;

    @Column({ default: false })
    diatesis_hemorragia: boolean;

    @Column({ default: false })
    sinusitis: boolean;

    @Column({ default: false })
    ulcera_gastroduodenal: boolean;

    @Column({ default: false })
    enfermedades_tiroides: boolean;

    // Observaciones y Médico
    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ nullable: true })
    medico_cabecera: string;

    @Column({ nullable: true })
    enfermedad_actual: string;

    // Medicamentos
    @Column({ default: false })
    toma_medicamentos: boolean;

    @Column({ nullable: true })
    medicamentos_detalle: string;

    @Column({ nullable: true })
    tratamiento: string;

    // Historial Dental
    @Column({ nullable: true })
    ultima_consulta: string; // '6 meses', 'mas de 1 año', 'mas de 3 años'

    @Column({ nullable: true })
    frecuencia_cepillado: string; // 'Una', 'Dos', 'Tres', 'Mas'

    // Elementos de Higiene
    @Column({ default: false })
    usa_cepillo: boolean;

    @Column({ default: false })
    usa_hilo_dental: boolean;

    @Column({ default: false })
    usa_enjuague: boolean;

    // Otros Síntomas
    @Column({ default: false })
    mal_aliento: boolean;

    @Column({ nullable: true })
    causa_mal_aliento: string;

    @Column({ default: false })
    sangra_encias: boolean;

    @Column({ default: false })
    dolor_cara: boolean;

    @Column({ type: 'text', nullable: true })
    comentarios: string;

    @OneToOne(() => Paciente, (paciente) => paciente.fichaMedica)
    paciente: Paciente;
}
