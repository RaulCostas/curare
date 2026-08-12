import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Proforma } from '../proformas/entities/proforma.entity';
import { FormaPago } from '../forma_pago/entities/forma_pago.entity';
import { ComisionTarjeta } from '../comision_tarjeta/entities/comision_tarjeta.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { TransferSaldoDto } from './dto/transfer-saldo.dto';

@Injectable()
export class PagosService {
    constructor(
        @InjectRepository(Pago)
        private readonly pagoRepository: Repository<Pago>,
        private readonly dataSource: DataSource,
    ) { }

    async create(createDto: CreatePagoDto): Promise<Pago> {
        try {
            const hasRecibo = createDto.recibo && createDto.recibo.trim() !== '';
            const hasFactura = createDto.factura && createDto.factura.trim() !== '';
            if (!hasRecibo && !hasFactura) {
                throw new BadRequestException('Debe registrar obligatoriamente al menos un número de Recibo o de Factura.');
            }

            const pago = this.pagoRepository.create(createDto);
            if (createDto.formaPagoId) {
                pago.formaPagoRel = { id: createDto.formaPagoId } as any;
            }
            if (createDto.comisionTarjetaId) {
                pago.comisionTarjeta = { id: createDto.comisionTarjetaId } as any;
                const comisionRepo = this.dataSource.getRepository(ComisionTarjeta);
                const comisionEntity = await comisionRepo.findOne({ where: { id: createDto.comisionTarjetaId } });
                if (comisionEntity && comisionEntity.monto) {
                    const percent = Number(comisionEntity.monto);
                    pago.monto_comision = Number((Number(createDto.monto) * (percent / 100)).toFixed(2));
                }
            } else {
                pago.monto_comision = 0;
            }
            return await this.pagoRepository.save(pago);
        } catch (error) {
            console.error('Error al guardar pago en BD:', error);
            throw error;
        }
    }

    async findAll(fecha?: string, startDate?: string, endDate?: string): Promise<Pago[]> {
        const options: any = {
            relations: ['paciente', 'proforma', 'comisionTarjeta', 'formaPagoRel'],
            order: { fecha: 'DESC' }
        };

        const startStr = (startDate || fecha || '').split('T')[0];
        const endStr = (endDate || fecha || '').split('T')[0];

        if (startStr && endStr) {
            options.where = {
                fecha: Between(startStr, endStr)
            };
        }

        return await this.pagoRepository.find(options);
    }

    async findAllByPaciente(pacienteId: number): Promise<Pago[]> {
        return await this.pagoRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'proforma', 'comisionTarjeta', 'formaPagoRel'],
            order: { fecha: 'DESC' }
        });
    }

    async findOne(id: number): Promise<Pago> {
        const pago = await this.pagoRepository.findOne({
            where: { id },
            relations: ['paciente', 'proforma', 'comisionTarjeta', 'formaPagoRel']
        });
        if (!pago) {
            throw new NotFoundException(`Pago #${id} not found`);
        }
        return pago;
    }

    async update(id: number, updateDto: UpdatePagoDto): Promise<Pago> {
        const pago = await this.findOne(id);
        this.pagoRepository.merge(pago, updateDto);

        const hasRecibo = pago.recibo && pago.recibo.trim() !== '';
        const hasFactura = pago.factura && pago.factura.trim() !== '';
        if (!hasRecibo && !hasFactura) {
            throw new BadRequestException('Debe registrar obligatoriamente al menos un número de Recibo o de Factura.');
        }
        if (updateDto.formaPagoId) {
            pago.formaPagoRel = { id: updateDto.formaPagoId } as any;
        }
        if (updateDto.comisionTarjetaId) {
            pago.comisionTarjeta = { id: updateDto.comisionTarjetaId } as any;
            const comisionRepo = this.dataSource.getRepository(ComisionTarjeta);
            const comisionEntity = await comisionRepo.findOne({ where: { id: updateDto.comisionTarjetaId } });
            if (comisionEntity && comisionEntity.monto) {
                const percent = Number(comisionEntity.monto);
                pago.monto_comision = Number((Number(pago.monto) * (percent / 100)).toFixed(2));
            }
        } else if (updateDto.comisionTarjetaId === null || (updateDto as any).comisionTarjetaId === 0) {
            pago.comisionTarjeta = null as any;
            pago.monto_comision = 0;
        }
        return await this.pagoRepository.save(pago);
    }

    async remove(id: number): Promise<void> {
        const pago = await this.findOne(id);
        await this.pagoRepository.remove(pago);
    }

    async transferirSaldo(transferDto: TransferSaldoDto): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Fetch related entities to construct the observation string
            // Better to fetch Paciente directly using entity name string to avoid circular dependency if not imported?
            // Or just use the table name or import the entity. I will import entities at the top.
            // Let's assume standard import is better. 
            // Actually, I can use queryRunner.manager.findOne(Paciente, ...) if I add the import.

            // Re-fetching robustly:
            const PacienteRepo = queryRunner.manager.getRepository(Paciente);
            const ProformaRepo = queryRunner.manager.getRepository(Proforma);
            const FormaPagoRepo = queryRunner.manager.getRepository(FormaPago);

            // Fetch 'Efectivo' payment method
            let efectivo = await FormaPagoRepo.findOne({ where: { forma_pago: 'Efectivo' } });
            // Fallback to searching case insensitive or just ID 1
            if (!efectivo) {
                // Try loose search or ID 1
                const all = await FormaPagoRepo.find();
                efectivo = all.find(fp => fp.forma_pago.toLowerCase().includes('efectivo')) || await FormaPagoRepo.findOne({ where: { id: 1 } });
            }

            if (!efectivo) {
                throw new NotFoundException('No se encontró la forma de pago "Efectivo" para realizar la transferencia automática.');
            }

            const sourceP = await PacienteRepo.findOne({ where: { id: transferDto.sourcePacienteId } });
            const targetP = await PacienteRepo.findOne({ where: { id: transferDto.targetPacienteId } });

            if (!sourceP || !targetP) {
                throw new NotFoundException('Pacientes no encontrados para la transferencia');
            }

            let sourceProfNum = 'GENERAL';
            if (transferDto.sourceProformaId) {
                const sp = await ProformaRepo.findOne({ where: { id: transferDto.sourceProformaId } });
                if (sp) sourceProfNum = sp.numero.toString();
            }

            let targetProfNum = 'GENERAL';
            if (transferDto.targetProformaId) {
                const tp = await ProformaRepo.findOne({ where: { id: transferDto.targetProformaId } });
                if (tp) targetProfNum = tp.numero.toString();
            }

            const sourceName = `${sourceP.nombre} ${sourceP.paterno}`;
            const targetName = `${targetP.nombre} ${targetP.paterno}`;

            // 1. Outgoing Payment (Source)
            // "TRAS. DE SALDO DEL PACIENTE: X, DEL PRES. # XX AL PACIENTE: Y AL PRES. # YY"
            const obsSource = `TRAS. DE SALDO DEL PACIENTE: ${sourceName}, DEL PRES. # ${sourceProfNum} AL PACIENTE: ${targetName} AL PRES. # ${targetProfNum}`;

            const outgoingPago = new Pago();
            outgoingPago.pacienteId = transferDto.sourcePacienteId;
            outgoingPago.proformaId = (transferDto.sourceProformaId || null) as any;
            outgoingPago.monto = -Math.abs(transferDto.amount); // Negative
            outgoingPago.moneda = 'Bolivianos';
            outgoingPago.tc = 0; // "vacios" - typically 0 or null for numbers? User said "vacios", but TS expects number. 0 is safer.
            outgoingPago.recibo = '';
            outgoingPago.factura = '';
            outgoingPago.formaPagoRel = efectivo; // EFECTIVO
            outgoingPago.observaciones = obsSource.toUpperCase();
            outgoingPago.fecha = new Date().toISOString().split('T')[0];

            // 2. Incoming Payment (Target)
            // "TRAS. DE SALDO DEL PACIENTE: Y, DEL PRES. # YY AL PACIENTE: X AL PRES. # XX"
            const obsTarget = `TRAS. DE SALDO DEL PACIENTE: ${targetName}, DEL PRES. # ${targetProfNum} AL PACIENTE: ${sourceName} AL PRES. # ${sourceProfNum}`;

            const incomingPago = new Pago();
            incomingPago.pacienteId = transferDto.targetPacienteId;
            incomingPago.proformaId = (transferDto.targetProformaId || null) as any;
            incomingPago.monto = Math.abs(transferDto.amount); // Positive
            incomingPago.moneda = 'Bolivianos';
            incomingPago.tc = 0;
            incomingPago.recibo = '';
            incomingPago.factura = '';
            incomingPago.formaPagoRel = efectivo; // EFECTIVO
            incomingPago.observaciones = obsTarget.toUpperCase();
            incomingPago.fecha = new Date().toISOString().split('T')[0];

            await queryRunner.manager.save(outgoingPago);
            await queryRunner.manager.save(incomingPago);

            await queryRunner.commitTransaction();
        } catch (err) {
            console.error("Error en Transacción de Transferencia:", err);
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}
