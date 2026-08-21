import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriaClinica } from './entities/historia_clinica.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { ProformaDetalle } from '../proformas/entities/proforma-detalle.entity';
import { CreateHistoriaClinicaDto } from './dto/create-historia_clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia_clinica.dto';

@Injectable()
export class HistoriaClinicaService {
    constructor(
        @InjectRepository(HistoriaClinica)
        private readonly historiaClinicaRepository: Repository<HistoriaClinica>,
        @InjectRepository(Pago)
        private readonly pagoRepository: Repository<Pago>,
        @InjectRepository(ProformaDetalle)
        private readonly proformaDetalleRepository: Repository<ProformaDetalle>,
    ) { }

    async create(createDto: CreateHistoriaClinicaDto): Promise<HistoriaClinica> {
        if (createDto.proformaDetalleId && (!createDto.precio || createDto.precio === 0)) {
            const detail = await this.proformaDetalleRepository.findOne({ where: { id: createDto.proformaDetalleId } });
            if (detail) {
                const unitPrice = Number(detail.precioUnitario) || 0;
                const desc = Number(detail.descuento) || 0;
                const subTotal = unitPrice * (createDto.cantidad || 1);
                const calcPrice = desc > 0 ? subTotal * (1 - desc / 100) : (Number(detail.total) || subTotal);
                createDto.precio = Math.round(calcPrice * 100) / 100;
            }
        }
        const historia = this.historiaClinicaRepository.create(createDto);
        return await this.historiaClinicaRepository.save(historia);
    }

    async findAll(): Promise<HistoriaClinica[]> {
        return await this.historiaClinicaRepository.find({
            relations: ['paciente', 'doctor', 'especialidad', 'proforma', 'proformaDetalle'],
            order: { fecha: 'DESC' }
        });
    }

    async findAllByPaciente(pacienteId: number): Promise<HistoriaClinica[]> {
        return await this.historiaClinicaRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'doctor', 'especialidad', 'proforma', 'proformaDetalle'],
            order: { fecha: 'DESC' }
        });
    }

    async findPendientesPago(doctorId: number): Promise<any[]> {
        const pendientes = await this.historiaClinicaRepository.find({
            where: {
                doctorId,
                pagado: 'NO',
            },
            relations: ['paciente', 'doctor', 'especialidad', 'proforma', 'proformaDetalle'],
            order: { fecha: 'ASC' }
        });

        if (pendientes.length === 0) return [];

        const proformaIds = [...new Set(pendientes.map(h => h.proformaId).filter(Boolean))];
        const pagosMap = new Map<number, Pago>();

        if (proformaIds.length > 0) {
            const pagos = await this.pagoRepository.find({
                where: proformaIds.map(proformaId => ({ proformaId })),
                relations: ['formaPagoRel'],
                order: { fecha: 'DESC', createdAt: 'DESC' }
            });

            pagos.forEach(p => {
                if (p.proformaId && !pagosMap.has(p.proformaId)) {
                    pagosMap.set(p.proformaId, p);
                }
            });
        }

        return pendientes.map(hc => {
            const ultimoPago = hc.proformaId ? pagosMap.get(hc.proformaId) : null;
            return {
                ...hc,
                ultimoPagoPaciente: ultimoPago ? {
                    fecha: ultimoPago.fecha,
                    forma_pago: ultimoPago.formaPagoRel?.forma_pago || '',
                    monto: ultimoPago.monto,
                    moneda: ultimoPago.moneda
                } : null
            };
        });
    }

    async findDoctoresConPendientes(): Promise<any[]> {
        const results = await this.historiaClinicaRepository
            .createQueryBuilder('hc')
            .select('doctor.id', 'id')
            .addSelect('doctor.nombre', 'nombre')
            .addSelect('doctor.paterno', 'paterno')
            .addSelect('doctor.materno', 'materno')
            .innerJoin('hc.doctor', 'doctor')
            .where('hc.pagado = :pagado', { pagado: 'NO' })
            .distinct(true)
            .orderBy('doctor.paterno', 'ASC')
            .getRawMany();
        console.log('Doctores con pendientes:', results);
        return results;
    }

    async findCancelados(): Promise<any[]> {
        const results = await this.historiaClinicaRepository.createQueryBuilder('hc')
            .leftJoinAndSelect('hc.paciente', 'paciente')
            .leftJoinAndSelect('hc.doctor', 'doctor')
            .leftJoinAndSelect('hc.proforma', 'proforma')
            .leftJoinAndSelect('proforma.pagos', 'pagos')
            .leftJoinAndSelect('pagos.formaPagoRel', 'formaPagoRel')
            .leftJoinAndSelect('hc.proformaDetalle', 'detalle')
            .leftJoinAndSelect('hc.pagosDetalleDoctores', 'pagosDetalleDoctores') // Join with doctor payment details
            .leftJoinAndSelect('pagosDetalleDoctores.pago', 'pagoDoctor') // Join to get the doctor payment header
            .where('hc.pagado = :pagado', { pagado: 'SI' })
            .orderBy('hc.fecha', 'DESC')
            .getMany();

        return results.map(hc => {
            // Find latest payment from patient
            const latestPayment = hc.proforma?.pagos?.sort((a, b) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            )[0];

            // Find date of payment to doctor
            const doctorPaymentDate = hc.pagosDetalleDoctores?.[0]?.pago?.fecha;

            return {
                ...hc,
                numeroPresupuesto: hc.proforma?.numero,
                costoLaboratorio: 0,
                fechaPagoPaciente: latestPayment?.fecha,
                formaPagoPaciente: latestPayment?.formaPagoRel?.forma_pago,
                descuento: hc.proformaDetalle?.descuento || 0,
                fechaPagoDoctor: doctorPaymentDate // New field for the first column
            };
        });
    }

    async findOne(id: number): Promise<HistoriaClinica> {
        const historia = await this.historiaClinicaRepository.findOne({
            where: { id },
            relations: ['paciente', 'doctor', 'especialidad', 'proforma', 'proformaDetalle']
        });
        if (!historia) {
            throw new NotFoundException(`Historia Clínica #${id} not found`);
        }
        return historia;
    }

    async update(id: number, updateDto: UpdateHistoriaClinicaDto): Promise<HistoriaClinica> {
        const historia = await this.historiaClinicaRepository.findOne({ where: { id } });
        if (!historia) {
            throw new NotFoundException(`Historia Clínica #${id} not found`);
        }
        this.historiaClinicaRepository.merge(historia, updateDto);
        return await this.historiaClinicaRepository.save(historia);
    }

    async remove(id: number): Promise<void> {
        const historia = await this.findOne(id);
        
        // Eliminar registros hijos para evitar errores de llave foránea
        await this.historiaClinicaRepository.query(
            `DELETE FROM material_utilizado_detalle WHERE "materialUtilizadoId" IN (SELECT id FROM material_utilizado WHERE "historiaClinicaId" = $1)`,
            [id]
        );
        await this.historiaClinicaRepository.query(
            `DELETE FROM material_utilizado WHERE "historiaClinicaId" = $1`,
            [id]
        );

        await this.historiaClinicaRepository.remove(historia);
    }
}
