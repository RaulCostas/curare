import { IsNumber, IsString, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class CreateProformaDetalleDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsNumber()
    arancelId: number;

    @IsNumber()
    precioUnitario: number;

    @IsNumber()
    tc: number;

    @IsOptional()
    @IsString()
    piezas?: string;

    @IsNumber()
    cantidad: number;

    @IsNumber()
    subTotal: number;

    @IsNumber()
    descuento: number;

    @IsNumber()
    total: number;

    @IsBoolean()
    posible: boolean;
}

export class CreateProformaDto {
    @IsNumber()
    pacienteId: number;

    @IsNumber()
    usuarioId: number;

    @IsOptional()
    @IsString()
    nota?: string;

    @IsOptional()
    @IsString()
    fecha?: string;

    @IsOptional()
    @IsBoolean()
    aprobado?: boolean;

    @IsOptional()
    @IsNumber()
    usuario_aprobado?: number;

    @IsOptional()
    @IsString()
    fecha_aprobado?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProformaDetalleDto)
    detalles: CreateProformaDetalleDto[];
}
