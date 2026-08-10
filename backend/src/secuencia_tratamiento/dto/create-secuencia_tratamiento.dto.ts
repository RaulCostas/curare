import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateSecuenciaTratamientoDto {
    @IsNumber()
    pacienteId: number;

    @IsNumber()
    proformaId: number;

    @IsOptional()
    @IsDateString()
    fecha?: string;

    @IsOptional()
    @IsString()
    periodoncia?: string;

    @IsOptional()
    @IsString()
    cirugia?: string;

    @IsOptional()
    @IsString()
    endodoncia?: string;

    @IsOptional()
    @IsString()
    operatoria?: string;

    @IsOptional()
    @IsString()
    protesis?: string;

    @IsOptional()
    @IsString()
    implantes?: string;

    @IsOptional()
    @IsString()
    ortodoncia?: string;

    @IsOptional()
    @IsString()
    odontopediatria?: string;
}

export class UpdateSecuenciaTratamientoDto {
    @IsOptional()
    @IsString()
    periodoncia?: string;

    @IsOptional()
    @IsString()
    cirugia?: string;

    @IsOptional()
    @IsString()
    endodoncia?: string;

    @IsOptional()
    @IsString()
    operatoria?: string;

    @IsOptional()
    @IsString()
    protesis?: string;

    @IsOptional()
    @IsString()
    implantes?: string;

    @IsOptional()
    @IsString()
    ortodoncia?: string;

    @IsOptional()
    @IsString()
    odontopediatria?: string;
}
