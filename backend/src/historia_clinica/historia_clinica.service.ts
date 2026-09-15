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
            relations: ['paciente', 'doctor', 'especialidad', 'proforma', 'proformaDetalle', 'arancel', 'arancel.especialidad', 'proformaDetalle.arancel', 'proformaDetalle.arancel.especialidad'],
            order: { fecha: 'DESC' }
        });
    }

    async findAllByPaciente(pacienteId: number): Promise<HistoriaClinica[]> {
        return await this.historiaClinicaRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'doctor', 'especialidad', 'proforma', 'proformaDetalle', 'arancel', 'arancel.especialidad', 'proformaDetalle.arancel', 'proformaDetalle.arancel.especialidad'],
            order: { fecha: 'DESC' }
        });
    }

    async findPendientesPago(doctorId: number): Promise<any[]> {
        const pendientes = await this.historiaClinicaRepository.find({
            where: {
                doctorId,
                pagado: 'NO',
                estadoTratamiento: 'terminado'
            },
            relations: ['paciente', 'doctor', 'especialidad', 'proforma', 'proformaDetalle', 'proformaDetalle.arancel', 'arancel', 'arancel.especialidad', 'proformaDetalle.arancel.especialidad'],
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

            const detallePago = hc.pagosDetalleDoctores?.[0];
            const doctorPaymentDate = detallePago?.pago?.fecha;
            const totalNeto = Number(hc.precio) || 0;
            const descuento = (Number(hc.proformaDetalle?.descuento) > 0)
                ? Number(hc.proformaDetalle?.descuento)
                : (Number(detallePago?.descuento) || 0);
            const costoLaboratorio = Number(detallePago?.costo_laboratorio) || 0;

            const discountAmount = (totalNeto * descuento) / 100;
            const afterDiscount = totalNeto - discountAmount;
            const totalCalculado = Math.max(0, Math.round((afterDiscount - costoLaboratorio) * 100) / 100);

            return {
                ...hc,
                numeroPresupuesto: hc.proforma?.numero,
                costoLaboratorio,
                fechaPagoPaciente: detallePago?.fecha_pago_paciente || latestPayment?.fecha,
                formaPagoPaciente: detallePago?.forma_pago_paciente || latestPayment?.formaPagoRel?.forma_pago || '-',
                descuento,
                totalNeto,
                total: totalCalculado,
                subTotal: totalCalculado,
                precio: totalCalculado,
                precioNetoOriginal: totalNeto,
                fechaPagoDoctor: doctorPaymentDate
            };
        });
    }

    async findTrabajosNoPagados(doctorId: number, page: number = 1, limit: number = 10, search?: string) {
        const queryBuilder = this.historiaClinicaRepository.createQueryBuilder('hc')
            .leftJoinAndSelect('hc.paciente', 'paciente')
            .leftJoinAndSelect('hc.doctor', 'doctor')
            .leftJoinAndSelect('hc.especialidad', 'especialidad')
            .leftJoinAndSelect('hc.proformaDetalle', 'proformaDetalle')
            .leftJoinAndSelect('proformaDetalle.arancel', 'arancel')
            .where('hc.doctorId = :doctorId', { doctorId })
            .andWhere('hc.pagado = :pagado', { pagado: 'NO' })
            .andWhere('COALESCE(hc.precio, 0) > 0')
            .orderBy('hc.fecha', 'DESC')
            .addOrderBy('hc.id', 'DESC');

        if (search && search.trim()) {
            const term = `%${search.trim().toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(paciente.nombre) LIKE :term OR LOWER(paciente.paterno) LIKE :term OR LOWER(paciente.materno) LIKE :term OR LOWER(hc.tratamiento) LIKE :term OR LOWER(arancel.detalle) LIKE :term)',
                { term }
            );
        }

        const skip = (page - 1) * limit;
        const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

        // Calculate grand total for all matching unpaid treatments
        const totalSumQuery = this.historiaClinicaRepository.createQueryBuilder('hc')
            .leftJoin('hc.paciente', 'paciente')
            .leftJoin('hc.proformaDetalle', 'proformaDetalle')
            .leftJoin('proformaDetalle.arancel', 'arancel')
            .select('COALESCE(SUM(hc.precio), 0)', 'sumTotal')
            .where('hc.doctorId = :doctorId', { doctorId })
            .andWhere('hc.pagado = :pagado', { pagado: 'NO' })
            .andWhere('COALESCE(hc.precio, 0) > 0');

        if (search && search.trim()) {
            const term = `%${search.trim().toLowerCase()}%`;
            totalSumQuery.andWhere(
                '(LOWER(paciente.nombre) LIKE :term OR LOWER(paciente.paterno) LIKE :term OR LOWER(paciente.materno) LIKE :term OR LOWER(hc.tratamiento) LIKE :term OR LOWER(arancel.detalle) LIKE :term)',
                { term }
            );
        }

        const rawSum = await totalSumQuery.getRawOne();
        const sumTotal = parseFloat(rawSum?.sumTotal || 0);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            sumTotal
        };
    }

    async findTrabajosPagados(doctorId: number, page: number = 1, limit: number = 10, search?: string) {
        const queryBuilder = this.historiaClinicaRepository.createQueryBuilder('hc')
            .leftJoinAndSelect('hc.paciente', 'paciente')
            .leftJoinAndSelect('hc.doctor', 'doctor')
            .leftJoinAndSelect('hc.especialidad', 'especialidad')
            .leftJoinAndSelect('hc.proformaDetalle', 'proformaDetalle')
            .leftJoinAndSelect('proformaDetalle.arancel', 'arancel')
            .leftJoinAndSelect('hc.pagosDetalleDoctores', 'pagosDetalle')
            .leftJoinAndSelect('pagosDetalle.pago', 'pagoDoctor')
            .where('hc.doctorId = :doctorId', { doctorId })
            .andWhere('hc.pagado = :pagado', { pagado: 'SI' })
            .orderBy('pagoDoctor.fecha', 'DESC')
            .addOrderBy('hc.id', 'DESC');

        if (search && search.trim()) {
            const term = `%${search.trim().toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(paciente.nombre) LIKE :term OR LOWER(paciente.paterno) LIKE :term OR LOWER(paciente.materno) LIKE :term OR LOWER(hc.tratamiento) LIKE :term OR LOWER(arancel.detalle) LIKE :term)',
                { term }
            );
        }

        const skip = (page - 1) * limit;
        const [rawResults, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

        const data = rawResults.map(hc => {
            const detallePago = hc.pagosDetalleDoctores?.[0];
            const fechaPago = detallePago?.pago?.fecha || hc.fecha;
            const totalNeto = Number(hc.precio) || 0;
            const descuento = detallePago?.descuento !== undefined && detallePago?.descuento !== null
                ? Number(detallePago.descuento)
                : (Number(hc.proformaDetalle?.descuento) || 0);
            const costoLab = Number(detallePago?.costo_laboratorio) || 0;
            const discountAmount = (totalNeto * descuento) / 100;
            const afterDiscount = totalNeto - discountAmount;
            const subTotal = Math.max(0, Math.round((afterDiscount - costoLab) * 100) / 100);

            return {
                id: hc.id,
                fechaCita: hc.fecha,
                fechaPago,
                paciente: hc.paciente,
                tratamiento: hc.tratamiento || hc.proformaDetalle?.arancel?.detalle || 'Sin tratamiento',
                pieza: hc.pieza || '',
                cantidad: hc.cantidad || 1,
                totalNeto,
                descuento,
                costoLab,
                subTotal,
                pagoId: detallePago?.pago?.id || null,
                formaPago: detallePago?.forma_pago_paciente || ''
            };
        });

        // Compute total sums for paid treatments matching criteria
        const allMatching = await queryBuilder.skip(0).take(10000).getMany();
        let sumSubTotal = 0;
        let sumTotalNeto = 0;
        let sumCostoLab = 0;

        allMatching.forEach(hc => {
            const d = hc.pagosDetalleDoctores?.[0];
            const tn = Number(hc.precio) || 0;
            const desc = d?.descuento !== undefined && d?.descuento !== null
                ? Number(d.descuento)
                : (Number(hc.proformaDetalle?.descuento) || 0);
            const cl = Number(d?.costo_laboratorio) || 0;
            const discAmt = (tn * desc) / 100;
            const st = Math.max(0, tn - discAmt - cl);
            sumTotalNeto += tn;
            sumCostoLab += cl;
            sumSubTotal += st;
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            sumTotalNeto: Math.round(sumTotalNeto * 100) / 100,
            sumCostoLab: Math.round(sumCostoLab * 100) / 100,
            sumSubTotal: Math.round(sumSubTotal * 100) / 100
        };
    }

    async findOne(id: number): Promise<HistoriaClinica> {
        const historia = await this.historiaClinicaRepository.findOne({
            where: { id },
            relations: ['paciente', 'doctor', 'especialidad', 'proforma', 'proformaDetalle', 'arancel', 'arancel.especialidad', 'proformaDetalle.arancel', 'proformaDetalle.arancel.especialidad']
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
