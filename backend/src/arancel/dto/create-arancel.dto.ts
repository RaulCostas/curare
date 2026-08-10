import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateArancelDto {
    @IsString()
    detalle: string;

    @IsNumber()
    precio1: number;

    @IsNumber()
    precio2: number;

    @IsNumber()
    tc: number;

    @IsString()
    @IsOptional()
    estado?: string;

    @IsNumber()
    idEspecialidad: number;
}
