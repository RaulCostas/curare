import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateFichaMedicaDto {
    @IsBoolean()
    @IsOptional()
    alergia_anestesicos?: boolean;

    @IsBoolean()
    @IsOptional()
    alergias_drogas?: boolean;

    @IsBoolean()
    @IsOptional()
    hepatitis?: boolean;

    @IsBoolean()
    @IsOptional()
    asma?: boolean;

    @IsBoolean()
    @IsOptional()
    diabetes?: boolean;

    @IsBoolean()
    @IsOptional()
    dolencia_cardiaca?: boolean;

    @IsBoolean()
    @IsOptional()
    hipertension?: boolean;

    @IsBoolean()
    @IsOptional()
    fiebre_reumatica?: boolean;

    @IsBoolean()
    @IsOptional()
    diatesis_hemorragia?: boolean;

    @IsBoolean()
    @IsOptional()
    sinusitis?: boolean;

    @IsBoolean()
    @IsOptional()
    ulcera_gastroduodenal?: boolean;

    @IsBoolean()
    @IsOptional()
    enfermedades_tiroides?: boolean;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsString()
    @IsOptional()
    medico_cabecera?: string;

    @IsString()
    @IsOptional()
    enfermedad_actual?: string;

    @IsBoolean()
    @IsOptional()
    toma_medicamentos?: boolean;

    @IsString()
    @IsOptional()
    medicamentos_detalle?: string;

    @IsString()
    @IsOptional()
    tratamiento?: string;

    @IsString()
    @IsOptional()
    ultima_consulta?: string;

    @IsString()
    @IsOptional()
    frecuencia_cepillado?: string;

    @IsBoolean()
    @IsOptional()
    usa_cepillo?: boolean;

    @IsBoolean()
    @IsOptional()
    usa_hilo_dental?: boolean;

    @IsBoolean()
    @IsOptional()
    usa_enjuague?: boolean;

    @IsBoolean()
    @IsOptional()
    mal_aliento?: boolean;

    @IsString()
    @IsOptional()
    causa_mal_aliento?: string;

    @IsBoolean()
    @IsOptional()
    sangra_encias?: boolean;

    @IsBoolean()
    @IsOptional()
    dolor_cara?: boolean;

    @IsString()
    @IsOptional()
    comentarios?: string;
}
