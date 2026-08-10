import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateConsentimientoPlantillaDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsNumber()
  @IsOptional()
  especialidadId?: number;

  @IsString()
  @IsOptional()
  estado?: string;
}

export class UpdateConsentimientoPlantillaDto extends PartialType(CreateConsentimientoPlantillaDto) {}
