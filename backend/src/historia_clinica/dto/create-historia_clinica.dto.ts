import { IsNotEmpty, IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateHistoriaClinicaDto {
    @IsNotEmpty()
    @IsNumber()
    pacienteId: number;

    @IsNotEmpty()
    @IsDateString()
    fecha: string;

    @IsOptional()
    @IsString()
    pieza?: string;

    @IsOptional()
    @IsNumber()
    cantidad?: number;

    @IsOptional()
    @IsNumber()
    proformaDetalleId?: number;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsNumber()
    especialidadId?: number;

    @IsOptional()
    @IsNumber()
    doctorId?: number;

    @IsOptional()
    @IsNumber()
    personalId?: number;

    @IsNotEmpty()
    @IsNumber()
    hoja: number;

    @IsOptional()
    @IsString()
    estadoTratamiento?: string;

    @IsOptional()
    @IsString()
    estadoPresupuesto?: string;

    @IsOptional()
    @IsNumber()
    proformaId?: number;

    @IsOptional()
    @IsString()
    tratamiento?: string;

    @IsOptional()
    resaltar?: boolean;

    @IsOptional()
    casoClinico?: boolean;


    @IsOptional()
    @IsString()
    pagado?: string;

    @IsOptional()
    @IsNumber()
    precio?: number;
}
