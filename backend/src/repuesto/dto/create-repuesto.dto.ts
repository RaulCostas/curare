import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateRepuestoDto {
    @IsOptional()
    @IsString()
    fecha?: string;

    @IsOptional()
    @IsString()
    consultorio?: string;

    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString()
    descripcion: string;

    @IsOptional()
    @IsString()
    motivo?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsNumber({}, { message: 'El costo debe ser un número válido' })
    costo?: number;

    @IsOptional()
    @IsNumber({}, { message: 'La mano de obra debe ser un número válido' })
    manoObra?: number;
}
