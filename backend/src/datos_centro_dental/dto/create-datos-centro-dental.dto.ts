import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDatosCentroDentalDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsString()
  @IsOptional()
  latitud?: string;

  @IsString()
  @IsOptional()
  longitud?: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  celular: string;

  @IsString()
  @IsNotEmpty()
  emergencias: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  qr?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  horarios?: string;
}
