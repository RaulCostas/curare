import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { PacienteMusica } from './entities/paciente-musica.entity';
import { PacienteTelevision } from './entities/paciente-television.entity';

@Injectable()
export class PacientesService {
    constructor(
        @InjectRepository(Paciente)
        private pacientesRepository: Repository<Paciente>,
        @InjectRepository(PacienteMusica)
        private pacienteMusicaRepository: Repository<PacienteMusica>,
        @InjectRepository(PacienteTelevision)
        private pacienteTelevisionRepository: Repository<PacienteTelevision>,
    ) { }

    async create(createPacienteDto: CreatePacienteDto): Promise<Paciente> {
        console.log('Creating Paciente with DTO:', createPacienteDto);
        const paciente = this.pacientesRepository.create(createPacienteDto);
        return await this.pacientesRepository.save(paciente);
    }

    async findAll(page: number = 1, limit: number = 10, search: string = ''): Promise<{ data: Paciente[], total: number, page: number, limit: number, totalPages: number }> {
        const skip = (page - 1) * limit;

        const queryBuilder = this.pacientesRepository.createQueryBuilder('paciente');

        // Include relations that were eager
        queryBuilder.leftJoinAndSelect('paciente.categoria', 'categoria');
        queryBuilder.leftJoinAndSelect('paciente.fichaMedica', 'fichaMedica');

        if (search) {
            const searchTerm = `%${search}%`;
            queryBuilder.where(
                "(paciente.nombre ILIKE :search OR paciente.paterno ILIKE :search OR paciente.materno ILIKE :search OR CONCAT(paciente.nombre, ' ', paciente.paterno, ' ', paciente.materno) ILIKE :search OR CONCAT(paciente.paterno, ' ', paciente.materno, ' ', paciente.nombre) ILIKE :search)",
                { search: searchTerm }
            );
        }

        queryBuilder
            .orderBy('paciente.paterno', 'ASC')
            .addOrderBy('paciente.materno', 'ASC')
            .addOrderBy('paciente.nombre', 'ASC')
            .skip(skip)
            .take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<Paciente> {
        const paciente = await this.pacientesRepository.findOne({ where: { id } });
        if (!paciente) {
            throw new Error('Paciente not found');
        }
        return paciente;
    }

    async update(id: number, updatePacienteDto: UpdatePacienteDto): Promise<Paciente> {
        console.log(`Updating Paciente ${id} with DTO:`, updatePacienteDto);

        const paciente = await this.findOne(id);
        if (!paciente) {
            throw new NotFoundException(`Paciente #${id} not found`);
        }

        // Merge main patient data
        this.pacientesRepository.merge(paciente, updatePacienteDto);

        // Handle nested FichaMedica manually if needed
        if (updatePacienteDto.fichaMedica) {
            if (!paciente.fichaMedica) {
                paciente.fichaMedica = updatePacienteDto.fichaMedica as any;
            } else {
                Object.assign(paciente.fichaMedica, updatePacienteDto.fichaMedica);
            }
        }

        return await this.pacientesRepository.save(paciente);
    }

    async remove(id: number): Promise<void> {
        await this.pacientesRepository.delete(id);
    }

    async getDashboardStats(): Promise<{ totalPacientes: number, birthdayPacientes: Paciente[] }> {
        const totalPacientes = await this.pacientesRepository.count();

        // Get today's date parts
        const today = new Date();
        const month = today.getMonth() + 1; // JS months are 0-indexed
        const day = today.getDate();

        // Query for patients with birthday today
        // Note: This assumes fecha_nacimiento is stored as a date or string 'YYYY-MM-DD'
        // We use raw query for better date extraction compatibility across DBs, 
        // but for TypeORM/Postgres specifically:
        const birthdayPacientes = await this.pacientesRepository
            .createQueryBuilder('paciente')
            .where('EXTRACT(MONTH FROM paciente.fecha_nacimiento) = :month', { month })
            .andWhere('EXTRACT(DAY FROM paciente.fecha_nacimiento) = :day', { day })
            .getMany();

        return {
            totalPacientes,
            birthdayPacientes
        };
    }

    async findByCelular(celular: string): Promise<Paciente | null> {
        // 1. Try strict match first
        let paciente = await this.pacientesRepository.findOne({ where: { celular } });
        if (paciente) return paciente;

        // 2. Try super fuzzy match (Digits only equality)
        // This handles cases like:
        // DB: "+591 700-123" -> "591700123"
        // Search: "591700123" -> Match!

        const cleanCelular = celular.replace(/[^0-9]/g, '');
        if (!cleanCelular) return null; // Avoid searching empty string

        try {
            paciente = await this.pacientesRepository.createQueryBuilder('p')
                // Remove everything except 0-9 from DB column and compare with clean input
                .where("REGEXP_REPLACE(p.celular, '[^0-9]', '', 'g') = :cleanCelular", { cleanCelular })
                .getOne();
        } catch (e) {
            console.error('Error in fuzzy search:', e);
        }

        return paciente || null;
    }

    async findPendientes(tab: 'agendados' | 'no_agendados', doctorId?: number, especialidadId?: number) {
        const today = new Date().toISOString().split('T')[0];

        // Extra filters for doctor/especialidad applied on the pending presupuesto
        const doctorFilter = doctorId ? `AND lhc."doctorId" = ${doctorId}` : '';
        const especialidadFilter = especialidadId ? `AND lhc."especialidadId" = ${especialidadId}` : '';

        // Tab condition: future appointment existence
        const tabCondition = tab === 'agendados'
            ? `EXISTS (SELECT 1 FROM agenda a WHERE a."pacienteId" = p.id AND a.fecha >= '${today}')`
            : `NOT EXISTS (SELECT 1 FROM agenda a WHERE a."pacienteId" = p.id AND a.fecha >= '${today}')`;

        console.log(`FindPendientes: Tab=${tab}, Date=${today}, Doctor=${doctorId}, Spec=${especialidadId}`);

        // KEY LOGIC:
        // A presupuesto is "pending" only if its LAST HC record has estadoPresupuesto='no terminado'.
        // Intermediate records with 'no terminado' do NOT count if the final record closed them.
        // We use DISTINCT ON (pacienteId, proformaId) ordered by fecha DESC to get the last record per proforma.
        const query = `
            WITH last_hc_per_presupuesto AS (
                -- For each patient+proforma, get only its most recent HC record
                SELECT DISTINCT ON (hc."pacienteId", hc."proformaId")
                    hc."pacienteId",
                    hc."proformaId",
                    hc.id         AS hc_id,
                    hc."estadoPresupuesto",
                    hc."estadoTratamiento",
                    hc."doctorId",
                    hc."especialidadId",
                    hc.tratamiento,
                    hc.fecha
                FROM historia_clinica hc
                WHERE hc."proformaId" IS NOT NULL
                ORDER BY hc."pacienteId", hc."proformaId", hc.fecha DESC, hc.id DESC
            ),
            patient_latest_pending AS (
                -- Among those last records, keep only presupuestos still 'no terminado'
                -- and rank them per patient by most recent date
                SELECT
                    lhc."pacienteId",
                    lhc."proformaId",
                    lhc."doctorId",
                    lhc."especialidadId",
                    lhc.tratamiento,
                    lhc.fecha       AS hc_fecha,
                    pr.numero       AS numero_presupuesto,
                    ROW_NUMBER() OVER (
                        PARTITION BY lhc."pacienteId"
                        ORDER BY lhc.fecha DESC
                    ) AS rn
                FROM last_hc_per_presupuesto lhc
                LEFT JOIN proformas pr ON pr.id = lhc."proformaId"
                WHERE lhc."estadoPresupuesto" = 'no terminado'
                  ${doctorFilter}
                  ${especialidadFilter}
            )
            SELECT
                p.id, p.nombre, p.paterno, p.materno, p.celular,
                -- ultima_cita: max between last agenda and last HC date
                GREATEST(
                    (SELECT a.fecha FROM agenda a
                     WHERE a."pacienteId" = p.id ORDER BY a.fecha DESC LIMIT 1),
                    (SELECT hc.fecha FROM historia_clinica hc
                     WHERE hc."pacienteId" = p.id ORDER BY hc.fecha DESC LIMIT 1)
                ) AS ultima_cita,
                plp.numero_presupuesto,
                (SELECT CONCAT(d.nombre, ' ', d.paterno)
                 FROM doctor d WHERE d.id = plp."doctorId") AS ultimo_doctor,
                plp.tratamiento                              AS ultimo_tratamiento,
                (SELECT e.especialidad
                 FROM especialidad e WHERE e.id = plp."especialidadId") AS ultima_especialidad
            FROM pacientes p
            JOIN patient_latest_pending plp
                ON plp."pacienteId" = p.id AND plp.rn = 1
            WHERE p.estado = 'activo'
              AND ${tabCondition}
        `;

        const results = await this.pacientesRepository.query(query);
        console.log(`FindPendientes: Found ${results.length} results`);
        return results;
    }

    async findNoRegistrados() {
        const today = new Date().toISOString().split('T')[0];
        console.log(`FindNoRegistrados: Date=${today}`);
        const query = `
            SELECT 
                p.id as "pacienteId",
                p.nombre, p.paterno, p.materno,
                a.fecha, a.hora, a.consultorio
            FROM agenda a
            JOIN pacientes p ON p.id = a."pacienteId"
            WHERE a.fecha <= '${today}' 
              AND LOWER(a.estado) = 'atendido'
              AND NOT EXISTS (
                  SELECT 1 
                  FROM historia_clinica hc 
                  WHERE hc."pacienteId" = a."pacienteId" 
                    AND hc.fecha = a.fecha
              )
            ORDER BY a.fecha DESC
        `;
        console.log('Query:', query);
        const results = await this.pacientesRepository.query(query);
        console.log(`Found ${results.length} no registrados results`);
        return results;
    }

    async getStatistics(year: number): Promise<any[]> {
        const query = this.pacientesRepository.createQueryBuilder('paciente')
            .select('EXTRACT(MONTH FROM paciente.fecha)', 'month')
            .addSelect('COUNT(paciente.id)', 'count')
            .where('EXTRACT(YEAR FROM paciente.fecha) = :year', { year })
            .groupBy('EXTRACT(MONTH FROM paciente.fecha)');

        const rawResults = await query.getRawMany();

        // Initialize array for 12 months with 0 counts
        const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            count: 0
        }));

        // Fill in actual data
        rawResults.forEach(r => {
            const mIndex = parseInt(r.month) - 1;
            if (mIndex >= 0 && mIndex < 12) {
                monthlyStats[mIndex].count = parseInt(r.count);
            }
        });

        return monthlyStats;
    }

    // Métodos para Música
    async getPacienteMusica(pacienteId: number): Promise<number[]> {
        const relaciones = await this.pacienteMusicaRepository.find({
            where: { pacienteId }
        });
        return relaciones.map(r => r.musicaId);
    }

    async savePacienteMusica(pacienteId: number, musicaIds: number[]): Promise<void> {
        // Eliminar relaciones existentes
        await this.pacienteMusicaRepository.delete({ pacienteId });

        // Crear nuevas relaciones
        if (musicaIds && musicaIds.length > 0) {
            const relaciones = musicaIds.map(musicaId => ({
                pacienteId,
                musicaId
            }));
            await this.pacienteMusicaRepository.save(relaciones);
        }
    }

    // Métodos para Televisión
    async getPacienteTelevision(pacienteId: number): Promise<number[]> {
        const relaciones = await this.pacienteTelevisionRepository.find({
            where: { pacienteId }
        });
        return relaciones.map(r => r.televisionId);
    }

    async savePacienteTelevision(pacienteId: number, televisionIds: number[]): Promise<void> {
        // Eliminar relaciones existentes
        await this.pacienteTelevisionRepository.delete({ pacienteId });

        // Crear nuevas relaciones
        if (televisionIds && televisionIds.length > 0) {
            const relaciones = televisionIds.map(televisionId => ({
                pacienteId,
                televisionId
            }));
            await this.pacienteTelevisionRepository.save(relaciones);
        }
    }

    async uploadFoto(id: number, filename: string) {
        const paciente = await this.pacientesRepository.findOne({ where: { id } });
        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }
        paciente.foto = filename;
        return this.pacientesRepository.save(paciente);
    }
}
