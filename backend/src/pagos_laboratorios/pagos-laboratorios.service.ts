import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { PagoLaboratorio } from './entities/pago-laboratorio.entity';
import { CreatePagoLaboratorioDto } from './dto/create-pago-laboratorio.dto';
import { UpdatePagoLaboratorioDto } from './dto/update-pago-laboratorio.dto';
import { TrabajoLaboratorio } from '../trabajos_laboratorios/entities/trabajo_laboratorio.entity';
import { FormaPago } from '../forma_pago/entities/forma_pago.entity';

@Injectable()
export class PagosLaboratoriosService {
    constructor(
        @InjectRepository(PagoLaboratorio)
        private pagoLaboratorioRepository: Repository<PagoLaboratorio>,
        private dataSource: DataSource,
    ) { }

    async create(createDto: CreatePagoLaboratorioDto) {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Si la forma de pago es Deposito o Transferencia, jalar banco y numero_cuenta de la tabla de laboratorios
            if (createDto.idforma_pago) {
                const formaPago = await queryRunner.manager.findOne(FormaPago, { where: { id: createDto.idforma_pago } });
                const fpName = (formaPago?.forma_pago || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const isDepositoOrTransferencia = fpName.includes('deposito') || fpName.includes('transferencia');

                if (isDepositoOrTransferencia) {
                    if (!createDto.banco && createDto.idTrabajos_Laboratorios) {
                        const trabajo = await queryRunner.manager.findOne(TrabajoLaboratorio, {
                            where: { id: createDto.idTrabajos_Laboratorios },
                            relations: ['laboratorio']
                        });
                        if (trabajo?.laboratorio) {
                            const labBanco = (trabajo.laboratorio.banco || '').trim();
                            const labCuenta = (trabajo.laboratorio.numero_cuenta || '').trim();
                            const bancoStr = [labBanco, labCuenta].filter(Boolean).join(' ').trim();
                            if (bancoStr) {
                                createDto.banco = bancoStr;
                            }
                        }
                    }
                } else {
                    createDto.banco = null as any;
                }
            }

            // Save Payment
            const pago = queryRunner.manager.create(PagoLaboratorio, createDto);
            const savedPago = await queryRunner.manager.save(pago);

            // Update Work Status
            await queryRunner.manager.update(TrabajoLaboratorio, createDto.idTrabajos_Laboratorios, {
                pagado: 'si'
            });

            await queryRunner.commitTransaction();
            return savedPago;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    /*
     * Note: For removal, we should probably revert the 'pagado' status to 'no',
     * but the prompt didn't explicitly ask for full reversal logic. I'll add a simple delete for now,
     * or better yet, a robust check. Let's stick to simple delete but ideally we'd set pagado='no'.
     * I'll implement the revert logic for robustness.
     */
    async remove(id: number) {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const pago = await queryRunner.manager.findOne(PagoLaboratorio, { where: { id } });
            if (pago) {
                // Revert Work Status
                await queryRunner.manager.update(TrabajoLaboratorio, pago.idTrabajos_Laboratorios, {
                    pagado: 'no'
                });
                // Delete Payment
                await queryRunner.manager.remove(pago);
            }
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    findAll(fecha?: string, startDate?: string, endDate?: string) {
        const options: any = {
            relations: ['trabajoLaboratorio', 'trabajoLaboratorio.paciente', 'trabajoLaboratorio.laboratorio', 'trabajoLaboratorio.precioLaboratorio', 'formaPago'],
            order: { id: 'DESC' }
        };
        const startStr = (startDate || fecha || '').split('T')[0];
        const endStr = (endDate || fecha || '').split('T')[0];

        if (startStr && endStr) {
            options.where = {
                fecha: Between(startStr, endStr)
            };
        }
        return this.pagoLaboratorioRepository.find(options);
    }

    findOne(id: number) {
        return this.pagoLaboratorioRepository.findOne({
            where: { id },
            relations: ['trabajoLaboratorio', 'formaPago']
        });
    }

    async update(id: number, updateDto: UpdatePagoLaboratorioDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const pago = await queryRunner.manager.findOne(PagoLaboratorio, { where: { id } });
            if (!pago) {
                throw new Error('Pago no encontrado');
            }

            const idFormaPago = updateDto.idforma_pago ?? pago.idforma_pago;
            const idTrabajo = updateDto.idTrabajos_Laboratorios ?? pago.idTrabajos_Laboratorios;

            if (idFormaPago) {
                const formaPago = await queryRunner.manager.findOne(FormaPago, { where: { id: idFormaPago } });
                const fpName = (formaPago?.forma_pago || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const isDepositoOrTransferencia = fpName.includes('deposito') || fpName.includes('transferencia');

                if (isDepositoOrTransferencia) {
                    if (!updateDto.banco && idTrabajo) {
                        const trabajo = await queryRunner.manager.findOne(TrabajoLaboratorio, {
                            where: { id: idTrabajo },
                            relations: ['laboratorio']
                        });
                        if (trabajo?.laboratorio) {
                            const labBanco = (trabajo.laboratorio.banco || '').trim();
                            const labCuenta = (trabajo.laboratorio.numero_cuenta || '').trim();
                            const bancoStr = [labBanco, labCuenta].filter(Boolean).join(' ').trim();
                            if (bancoStr) {
                                updateDto.banco = bancoStr;
                            }
                        }
                    }
                } else if (updateDto.idforma_pago && !isDepositoOrTransferencia) {
                    updateDto.banco = null as any;
                }
            }

            await queryRunner.manager.update(PagoLaboratorio, id, updateDto);
            await queryRunner.commitTransaction();
            return this.findOne(id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}
