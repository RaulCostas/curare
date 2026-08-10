import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateConsentimientoPacienteDto {
  @IsNumber()
  @IsNotEmpty()
  pacienteId: number;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  contenido_generado: string;
}

export class UpdateConsentimientoPacienteDto extends PartialType(CreateConsentimientoPacienteDto) {}
