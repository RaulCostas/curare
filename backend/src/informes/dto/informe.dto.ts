import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateInformeDto {
    @IsNumber()
    @IsNotEmpty()
    pacienteId: number;

    @IsNumber()
    @IsOptional()
    userId?: number;

    @IsString()
    @IsNotEmpty()
    fecha: string;

    @IsString()
    @IsNotEmpty()
    contenido: string;

    @IsBoolean()
    @IsOptional()
    esta_firmado?: boolean;
}

export class UpdateInformeDto extends PartialType(CreateInformeDto) {}
