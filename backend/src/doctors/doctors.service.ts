import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from './entities/doctor.entity';
import { HistoriaClinica } from '../historia_clinica/entities/historia_clinica.entity';

@Injectable()
export class DoctorsService {
    constructor(
        @InjectRepository(Doctor)
        private doctorsRepository: Repository<Doctor>,
        @InjectRepository(HistoriaClinica)
        private historiaClinicaRepository: Repository<HistoriaClinica>,
    ) { }

    async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
        const doctor = this.doctorsRepository.create(createDoctorDto);
        return this.doctorsRepository.save(doctor);
    }

    async getStatistics(fechaInicio: string, fechaFinal: string, status: string): Promise<any[]> {
        // Build date condition for the join
        let dateCondition = 'hc.estadoTratamiento = :estadoTrat';
        const params: any = { estadoTrat: 'terminado' };

        if (fechaInicio) {
            dateCondition += ' AND hc.fecha >= :fechaInicio';
            params.fechaInicio = fechaInicio;
        }
        if (fechaFinal) {
            dateCondition += ' AND hc.fecha <= :fechaFinal';
            params.fechaFinal = fechaFinal;
        }

        // Build query with join to proforma_detalle to get discount
        const qb = this.doctorsRepository.createQueryBuilder('doctor')
            .leftJoin(
                'historia_clinica',
                'hc',
                `hc.doctorId = doctor.id AND ${dateCondition}`,
                params
            )
            .leftJoin(
                'proforma_detalle',
                'pd',
                'pd.id = hc.proformaDetalleId'
            )
            .select([
                'doctor.id AS "id"',
                'doctor.nombre AS "nombre"',
                'doctor.paterno AS "paterno"',
                'doctor.materno AS "materno"',
                // Calculate total as price minus percentage discount
                // Formula: precio - (precio * descuento / 100)
                'COALESCE(SUM(hc.precio - (hc.precio * COALESCE(pd.descuento, 0) / 100)), 0) AS "totalGenerado"'
            ])
            .groupBy('doctor.id')
            .addGroupBy('doctor.nombre')
            .addGroupBy('doctor.paterno')
            .addGroupBy('doctor.materno')
            .orderBy('"totalGenerado"', 'DESC');

        if (status && status !== 'ambos') {
            qb.where('doctor.estado = :status', { status: status.toLowerCase() });
        }

        const rawResults = await qb.getRawMany();

        // Format results
        return rawResults.map(r => ({
            id: r.id,
            nombreCompleto: `${r.nombre} ${r.paterno} ${r.materno || ''}`.trim(),
            totalGenerado: parseFloat(r.totalGenerado)
        }));
    }

    async findAll(search?: string, page: number = 1, limit: number = 5): Promise<{
        data: Doctor[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;

        const queryBuilder = this.doctorsRepository.createQueryBuilder('doctor');

        if (search) {
            queryBuilder.where(
                'doctor.nombre ILIKE :search OR doctor.paterno ILIKE :search OR doctor.materno ILIKE :search',
                { search: `%${search}%` }
            );
        }

        const [data, total] = await queryBuilder
            .leftJoinAndSelect('doctor.especialidad', 'especialidad')
            .orderBy('doctor.paterno', 'ASC')
            .addOrderBy('doctor.materno', 'ASC')
            .addOrderBy('doctor.nombre', 'ASC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<Doctor> {
        const doctor = await this.doctorsRepository.findOne({
            where: { id },
            relations: ['especialidad'],
        });
        if (!doctor) {
            throw new NotFoundException(`Doctor with ID ${id} not found`);
        }
        return doctor;
    }

    async findByCelular(celular: string): Promise<Doctor | null> {
        return this.doctorsRepository.findOne({
            where: { celular },
            relations: ['especialidad']
        });
    }

    async update(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
        const doctor = await this.findOne(id);
        Object.assign(doctor, updateDoctorDto);
        return this.doctorsRepository.save(doctor);
    }

    async remove(id: number): Promise<void> {
        const doctor = await this.findOne(id);
        await this.doctorsRepository.remove(doctor);
    }
}
