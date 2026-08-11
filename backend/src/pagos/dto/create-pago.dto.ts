import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreatePagoDto {
    @IsNotEmpty()
    @IsNumber()
    pacienteId: number;

    @IsNotEmpty()
    @IsDateString()
    fecha: string;

    @IsOptional()
    @IsNumber()
    proformaId?: number;

    @IsNotEmpty()
    @IsNumber()
    monto: number;

    @IsOptional()
    @IsNumber()
    tc?: number;

    @IsOptional()
    @IsNumber()
    monto_comision?: number;

    @IsNotEmpty()
    @IsEnum(['Bolivianos', 'Dólares'])
    moneda: string;

    @IsOptional()
    @IsString()
    recibo?: string;

    @IsOptional()
    @IsString()
    factura?: string;



    @IsOptional()
    @IsNumber()
    comisionTarjetaId?: number;

    @IsOptional()
    @IsNumber()
    formaPagoId?: number;

    @IsOptional()
    @IsString()
    observaciones?: string;
}
