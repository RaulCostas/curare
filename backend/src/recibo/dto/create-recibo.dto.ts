import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateReciboDto {
    @IsOptional()
    @IsString()
    accessId?: string;

    @IsOptional()
    @IsString()
    fecha?: string;

    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    concepto?: string;

    @IsOptional()
    @IsString()
    moneda?: string;

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsNumber({}, { message: 'El monto debe ser un número válido' })
    monto: number;
}
