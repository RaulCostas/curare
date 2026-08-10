export class CreatePagosGastosFijosDto {
    gastoFijoId: number;
    fecha: string;
    monto: number;
    moneda: string;
    formaPagoId: number;
    observaciones?: string;
}
