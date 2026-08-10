import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class UpdatePricesDto {
    @IsNumber()
    @IsOptional()
    especialidadId?: number;

    @IsString()
    @IsEnum(['precio1', 'precio2', 'ambos'])
    tipoPrecio: 'precio1' | 'precio2' | 'ambos';

    @IsNumber()
    porcentaje: number;
}
