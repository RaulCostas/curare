import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateProximaCitaDto {
    @IsNotEmpty()
    @IsNumber()
    pacienteId: number;

    @IsOptional()
    @IsNumber()
    proformaId?: number;

    @IsNotEmpty()
    @IsString() // Can validate as DateString if frontend sends ISO
    fecha: string;

    @IsOptional()
    @IsString()
    pieza?: string;

    @IsOptional()
    @IsNumber()
    proformaDetalleId?: number;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsNotEmpty()
    @IsNumber()
    doctorId: number;

    @IsOptional()
    @IsString()
    estado?: string;
}
