export class CreateEstudioComplementarioDto {
    pacienteId: number;
    fecha: string;
    tipo_estudio: string;
    observaciones?: string;
    orden_estudio_url?: string;
    archivo_url?: string;
    usuarioId?: number;
}
