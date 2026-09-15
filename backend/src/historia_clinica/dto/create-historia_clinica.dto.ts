import { IsNotEmpty, IsOptional, IsNumber, IsString, IsDateString, Min } from 'class-validator';

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
    arancelId?: number;

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

    @IsNotEmpty({ message: 'El campo hoja es obligatorio' })
    @IsNumber({}, { message: 'El número de hoja debe ser un número válido' })
    @Min(1, { message: 'El número de hoja debe ser mayor a 0' })
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
    control?: boolean;

    @IsOptional()
    @IsString()
    pagado?: string;

    @IsOptional()
    @IsNumber()
    precio?: number;
}
