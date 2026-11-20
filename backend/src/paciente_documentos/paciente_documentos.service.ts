import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PacienteDocumento } from './entities/paciente_documento.entity';
import { CreatePacienteDocumentoDto } from './dto/create-paciente_documento.dto';
import { UpdatePacienteDocumentoDto } from './dto/update-paciente_documento.dto';
import * as fs from 'fs';
import { join } from 'path';

export const getPacienteDocumentosUploadDir = () => {
    const baseDir = (fs.existsSync('/data') && process.platform !== 'win32')
        ? '/data'
        : join(process.cwd(), 'uploads');
    const targetDir = join(baseDir, 'paciente_documentos');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
};

@Injectable()
export class PacienteDocumentosService {
    constructor(
        @InjectRepository(PacienteDocumento)
        private repo: Repository<PacienteDocumento>,
    ) {}

    async create(dto: CreatePacienteDocumentoDto, file?: any) {
        const doc = this.repo.create({
            pacienteId: Number(dto.pacienteId),
            documentoGeneralId: dto.documentoGeneralId ? Number(dto.documentoGeneralId) : null,
            titulo: dto.titulo,
            descripcion: dto.descripcion || '',
            fecha: dto.fecha || new Date().toISOString().split('T')[0],
            archivo: file ? file.filename : '',
            archivo_original: file ? file.originalname : '',
            tamano: file ? file.size : 0,
            mimetype: file ? file.mimetype : '',
        });
        return this.repo.save(doc);
    }

    async findByPaciente(pacienteId: number, search?: string) {
        const qb = this.repo.createQueryBuilder('pd')
            .leftJoinAndSelect('pd.documentoGeneral', 'dg')
            .where('pd.pacienteId = :pacienteId', { pacienteId });

        if (search) {
            qb.andWhere('(pd.titulo ILIKE :search OR pd.descripcion ILIKE :search OR pd.archivo_original ILIKE :search)', {
                search: `%${search}%`
            });
        }

        qb.orderBy('pd.fecha', 'DESC').addOrderBy('pd.id', 'DESC');
        return qb.getMany();
    }

    async findOne(id: number) {
        const doc = await this.repo.findOne({
            where: { id },
            relations: ['documentoGeneral'],
        });
        if (!doc) throw new NotFoundException('Documento del paciente no encontrado');
        return doc;
    }

    async update(id: number, dto: UpdatePacienteDocumentoDto, file?: any) {
        const doc = await this.findOne(id);

        if (dto.titulo !== undefined) doc.titulo = dto.titulo;
        if (dto.descripcion !== undefined) doc.descripcion = dto.descripcion;
        if (dto.fecha !== undefined) doc.fecha = dto.fecha;
        if (dto.documentoGeneralId !== undefined) {
            doc.documentoGeneralId = dto.documentoGeneralId ? Number(dto.documentoGeneralId) : null as any;
        }

        if (file) {
            const oldPath = join(getPacienteDocumentosUploadDir(), doc.archivo);
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
        const filePath = join(getPacienteDocumentosUploadDir(), doc.archivo);
        if (doc.archivo && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
        }
        return this.repo.remove(doc);
    }

    async getFilePath(id: number) {
        const doc = await this.findOne(id);
        const dir = getPacienteDocumentosUploadDir();
        const filePath = join(dir, doc.archivo);

        if (!fs.existsSync(filePath)) {
            const fallback = join(process.cwd(), 'uploads', 'paciente_documentos', doc.archivo);
            if (fs.existsSync(fallback)) {
                return { path: fallback, filename: doc.archivo_original || doc.archivo };
            }
            throw new NotFoundException('El archivo físico no fue encontrado en el servidor');
        }

        return { path: filePath, filename: doc.archivo_original || doc.archivo };
    }
}
