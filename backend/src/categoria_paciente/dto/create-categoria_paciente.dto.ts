import { IsString, IsOptional } from 'class-validator';

export class CreateCategoriaPacienteDto {
    @IsString()
    sigla: string;

    @IsString()
    descripcion: string;

    @IsString()
    color: string;

    @IsString()
    @IsOptional()
    estado: string;
}
