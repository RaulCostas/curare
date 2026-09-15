import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateEgresoInventarioDto {
    @IsNotEmpty()
    @IsNumber()
    inventarioId: number;

    @IsNotEmpty()
    @IsString()
    fecha: string;

    @IsNotEmpty()
    @IsNumber()
    cantidad: number;

    @IsNotEmpty()
    @IsString()
    consultorio: string;

    @IsNotEmpty()
    @IsString()
    fecha_vencimiento: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}
