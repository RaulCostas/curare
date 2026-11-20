export class CreatePacienteDocumentoDto {
    pacienteId: number;
    documentoGeneralId?: number | null;
    titulo: string;
    descripcion?: string;
    fecha?: string;
}
