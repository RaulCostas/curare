export class CreateInventarioDto {
    descripcion: string;
    cantidad_existente: number;
    stock_minimo: number;
    estado?: string;
    idespecialidad?: number;
    idgrupo_inventario?: number;
}

export class UpdateInventarioDto {
    descripcion?: string;
    cantidad_existente?: number;
    stock_minimo?: number;
    estado?: string;
    idespecialidad?: number;
    idgrupo_inventario?: number;
}
