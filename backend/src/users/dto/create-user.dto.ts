export class CreateUserDto {
    name: string;
    email: string;
    password: string;
    estado: string;
    foto?: string;
    recepcionista?: boolean;
    codigo_proforma?: number;
    permisos?: string[];
}
