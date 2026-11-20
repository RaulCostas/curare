import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { DocumentoGeneral } from './entities/documento_general.entity';
import { CreateDocumentoGeneralDto } from './dto/create-documento_general.dto';
import { UpdateDocumentoGeneralDto } from './dto/update-documento_general.dto';
import * as fs from 'fs';
import { join } from 'path';

export const getDocumentosGeneralesUploadDir = () => {
    const baseDir = (fs.existsSync('/data') && process.platform !== 'win32')
        ? '/data'
        : join(process.cwd(), 'uploads');
    const targetDir = join(baseDir, 'documentos_generales');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
};

@Injectable()
export class DocumentosGeneralesService {
    constructor(
        @InjectRepository(DocumentoGeneral)
        private repo: Repository<DocumentoGeneral>,
    ) {}

    async create(dto: CreateDocumentoGeneralDto, file?: any) {
        const doc = this.repo.create({
            nombre: dto.nombre,
            descripcion: dto.descripcion || '',
            estado: dto.estado || 'activo',
            archivo: file ? file.filename : '',
            archivo_original: file ? file.originalname : '',
            tamano: file ? file.size : 0,
            mimetype: file ? file.mimetype : '',
        });
        return this.repo.save(doc);
    }

    async findAll(search?: string, page: number = 1, limit: number = 10, estado?: string) {
        const skip = (page - 1) * limit;
        const qb = this.repo.createQueryBuilder('d');

        if (search) {
            qb.andWhere('(d.nombre ILIKE :search OR d.descripcion ILIKE :search OR d.archivo_original ILIKE :search)', {
                search: `%${search}%`
            });
        }

        if (estado && estado !== 'todos') {
            qb.andWhere('d.estado = :estado', { estado });
        }

        qb.orderBy('d.id', 'ASC');
        qb.skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number) {
        const doc = await this.repo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException('Documento general no encontrado');
        return doc;
    }

    async update(id: number, dto: UpdateDocumentoGeneralDto, file?: any) {
        const doc = await this.findOne(id);

        if (dto.nombre !== undefined) doc.nombre = dto.nombre;
        if (dto.descripcion !== undefined) doc.descripcion = dto.descripcion;
        if (dto.estado !== undefined) doc.estado = dto.estado;

        if (file) {
            // Delete old file if exists
            const oldPath = join(getDocumentosGeneralesUploadDir(), doc.archivo);
            if (doc.archivo && fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch {}
            }
            doc.archivo = file.filename;
            doc.archivo_original = file.originalname;
            doc.tamano = file.size;
            doc.mimetype = file.mimetype;
        }

        return this.repo.save(doc);
    }

    async remove(id: number) {
        const doc = await this.findOne(id);
        const filePath = join(getDocumentosGeneralesUploadDir(), doc.archivo);
        if (doc.archivo && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
        }
        return this.repo.remove(doc);
    }

    async getFilePath(id: number) {
        const doc = await this.findOne(id);
        const dir = getDocumentosGeneralesUploadDir();
        const filePath = join(dir, doc.archivo);

        if (!fs.existsSync(filePath)) {
            // Check fallback
            const fallback = join(process.cwd(), 'uploads', 'documentos_generales', doc.archivo);
            if (fs.existsSync(fallback)) {
                return { path: fallback, filename: doc.archivo_original || doc.archivo };
            }
            throw new NotFoundException('El archivo físico no fue encontrado en el servidor');
        }

        return { path: filePath, filename: doc.archivo_original || doc.archivo };
    }
}
