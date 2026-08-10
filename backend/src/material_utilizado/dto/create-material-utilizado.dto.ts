import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialUtilizadoDetalleDto {
    @IsNotEmpty()
    @IsNumber()
    inventarioId: number;

    @IsNotEmpty()
    @IsString()
    cantidad: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}

export class CreateMaterialUtilizadoDto {
    @IsNotEmpty()
    @IsNumber()
    historiaClinicaId: number;

    @IsNotEmpty()
    @IsString()
    fecha: string;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(1, { message: 'Debe agregar al menos un material' })
    @ValidateNested({ each: true })
    @Type(() => CreateMaterialUtilizadoDetalleDto)
    detalles: CreateMaterialUtilizadoDetalleDto[];
}
