export class CreateSeguimientoTrabajoDto {
    envio_retorno: 'Envio' | 'Retorno';
    fecha: string;
    observaciones: string;
    trabajoLaboratorioId: number;
}
