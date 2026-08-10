import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateMusicaDto {
    @IsString()
    @IsNotEmpty()
    musica: string;

    @IsString()
    @IsOptional()
    estado?: string;
}
