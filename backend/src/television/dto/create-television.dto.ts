import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateTelevisionDto {
    @IsString()
    @IsNotEmpty()
    television: string;

    @IsString()
    @IsOptional()
    estado?: string;
}
