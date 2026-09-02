import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstudioComplementario } from './entities/estudio_complementario.entity';
import { CreateEstudioComplementarioDto } from './dto/create-estudio-complementario.dto';
import { UpdateEstudioComplementarioDto } from './dto/update-estudio-complementario.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EstudiosComplementariosService {
    constructor(
        @InjectRepository(EstudioComplementario)
        private readonly estudioRepo: Repository<EstudioComplementario>,
    ) {}

    async create(createDto: CreateEstudioComplementarioDto): Promise<EstudioComplementario> {
        const estudio = this.estudioRepo.create({
            ...createDto,
            pacienteId: Number(createDto.pacienteId),
            usuarioId: createDto.usuarioId ? Number(createDto.usuarioId) : undefined,
        });
        return await this.estudioRepo.save(estudio);
    }

    async findAll(pacienteId?: number): Promise<EstudioComplementario[]> {
        const query = this.estudioRepo.createQueryBuilder('estudio')
            .leftJoinAndSelect('estudio.paciente', 'paciente')
            .leftJoinAndSelect('estudio.usuario', 'usuario')
            .orderBy('estudio.fecha', 'DESC')
            .addOrderBy('estudio.id', 'DESC');

        if (pacienteId) {
            query.where('estudio.pacienteId = :pacienteId', { pacienteId });
        }

        return await query.getMany();
    }

    async findOne(id: number): Promise<EstudioComplementario> {
        const estudio = await this.estudioRepo.findOne({
            where: { id },
            relations: ['paciente', 'usuario'],
        });
        if (!estudio) {
            throw new NotFoundException(`Estudio complementario #${id} no encontrado`);
        }
        return estudio;
    }

    async update(id: number, updateDto: UpdateEstudioComplementarioDto): Promise<EstudioComplementario> {
        const estudio = await this.findOne(id);

        // Si se reemplaza la orden de estudio, eliminar el archivo anterior si es local
        if (updateDto.orden_estudio_url && estudio.orden_estudio_url && updateDto.orden_estudio_url !== estudio.orden_estudio_url) {
            this.safeDeleteLocalFile(estudio.orden_estudio_url);
        }

        // Si se reemplaza el archivo resultado, eliminar el archivo anterior si es local
        if (updateDto.archivo_url && estudio.archivo_url && updateDto.archivo_url !== estudio.archivo_url) {
            this.safeDeleteLocalFile(estudio.archivo_url);
        }

        Object.assign(estudio, {
            ...updateDto,
            pacienteId: updateDto.pacienteId ? Number(updateDto.pacienteId) : estudio.pacienteId,
            usuarioId: updateDto.usuarioId ? Number(updateDto.usuarioId) : estudio.usuarioId,
        });

        return await this.estudioRepo.save(estudio);
    }

    async remove(id: number): Promise<{ success: boolean; message: string }> {
        const estudio = await this.findOne(id);
        
        if (estudio.orden_estudio_url) {
            this.safeDeleteLocalFile(estudio.orden_estudio_url);
        }
        if (estudio.archivo_url) {
            this.safeDeleteLocalFile(estudio.archivo_url);
        }

        await this.estudioRepo.remove(estudio);
        return { success: true, message: `Estudio complementario #${id} eliminado correctamente` };
    }

    private safeDeleteLocalFile(fileUrlOrName: string) {
        try {
            if (!fileUrlOrName) return;
            const filename = path.basename(fileUrlOrName);
            const possiblePaths = [
                path.join(process.cwd(), 'uploads', 'estudios_complementarios', filename),
                path.join(process.cwd(), 'uploads', filename),
                path.join('/data', 'estudios_complementarios', filename),
                path.join('/data', filename),
            ];

            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    fs.unlinkSync(p);
                }
            }
        } catch (error) {
            console.error('Error al eliminar archivo local de estudio complementario:', error);
        }
    }
}
