import { IsString, IsOptional, IsInt, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFichaMedicaDto } from '../../ficha_medica/dto/create-ficha_medica.dto';

export class CreatePacienteDto {
    @IsDateString()
    @IsOptional()
    fecha?: string;

    @IsString()
    paterno: string;

    @IsString()
    materno: string;

    @IsString()
    nombre: string;

    @IsString()
    direccion: string;

    @IsString()
    telefono: string;

    @IsString()
    celular: string;

    @IsString()
    email: string;

    @IsString()
    casilla: string;

    @IsString()
    profesion: string;

    @IsString()
    estado_civil: string;

    @IsString()
    direccion_oficina: string;

    @IsString()
    telefono_oficina: string;

    @IsDateString()
    fecha_nacimiento: string;

    @IsString()
    sexo: string;

    @IsString()
    seguro_medico: string;

    @IsString()
    poliza: string;

    @IsString()
    recomendado: string;

    @IsString()
    responsable: string;

    @IsString()
    parentesco: string;

    @IsString()
    direccion_responsable: string;

    @IsString()
    telefono_responsable: string;

    @IsOptional()
    @IsInt()
    idCategoria?: number;

    @IsString()
    @IsOptional()
    tipo_paciente: string;

    @IsString()
    @IsOptional()
    motivo: string;

    @IsString()
    @IsOptional()
    nomenclatura: string;

    @IsString()
    @IsOptional()
    estado: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateFichaMedicaDto)
    fichaMedica?: CreateFichaMedicaDto;
}
