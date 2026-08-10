import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FotoItemDto {
    @IsString()
    @IsNotEmpty()
    foto: string;

    @IsString()
    @IsOptional()
    descripcion?: string;
}

export class CreateCasoClinicoDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsNumber()
    @IsNotEmpty()
    especialidadId: number;

    @IsString()
    @IsOptional()
    video?: string;

    @IsString()
    @IsOptional()
    estado?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FotoItemDto)
    fotos?: FotoItemDto[];
}
