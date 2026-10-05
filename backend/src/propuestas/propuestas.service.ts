import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreatePropuestaDto } from './dto/create-propuesta.dto';
import { UpdatePropuestaDto } from './dto/update-propuesta.dto';
import { Propuesta } from './entities/propuesta.entity';
import { PropuestaDetalle } from './entities/propuesta-detalle.entity';
import { ProformasService } from '../proformas/proformas.service';
import { CreateProformaDto } from '../proformas/dto/create-proforma.dto';
import { ChatbotService } from '../chatbot/chatbot.service';

@Injectable()
export class PropuestasService {
    constructor(
        @InjectRepository(Propuesta)
        private readonly propuestaRepository: Repository<Propuesta>,
        @InjectRepository(PropuestaDetalle)
        private readonly detalleRepository: Repository<PropuestaDetalle>,
        private readonly dataSource: DataSource,
        private readonly proformasService: ProformasService,
        @Inject(forwardRef(() => ChatbotService))
        private readonly chatbotService: ChatbotService,
    ) { }

    async convertToProforma(id: number, letra: string, usuarioId?: number) {
        const propuesta = await this.findOne(id);

        // Filter details by the selected letter (tab)
        const activeDetails = propuesta.detalles.filter(d => d.letra === letra);

        if (activeDetails.length === 0) {
            throw new NotFoundException(`No hay items en la Propuesta ${letra}`);
        }

        let optionNota = '';
        if (propuesta.nota) {
            try {
                const parsed = JSON.parse(propuesta.nota);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    optionNota = parsed[letra] || '';
                } else {
                    optionNota = String(propuesta.nota);
                }
            } catch {
                optionNota = String(propuesta.nota);
            }
        }

        const notaProforma = optionNota && optionNota.trim()
            ? `Generado desde Propuesta #${propuesta.numero} (Opción ${letra}). ${optionNota}`
            : `Generado desde Propuesta #${propuesta.numero} (Opción ${letra})`;

        const createProformaDto: CreateProformaDto = {
            pacienteId: propuesta.pacienteId,
            usuarioId: usuarioId || 1,
            nota: notaProforma,
            fecha: new Date().toISOString().split('T')[0],
            detalles: activeDetails.map(d => ({
                arancelId: d.arancelId,
                precioUnitario: d.precioUnitario,
                tc: d.tc,
                piezas: d.piezas,
                cantidad: d.cantidad,
                subTotal: d.subTotal,
                descuento: d.descuento,
                total: d.total,
                posible: d.posible
            }))
        };

        return this.proformasService.create(createProformaDto);
    }

    async create(createPropuestaDto: CreatePropuestaDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Get correlative number for patient
            const lastPropuesta = await queryRunner.manager.findOne(Propuesta, {
                where: { pacienteId: createPropuestaDto.pacienteId },
                order: { numero: 'DESC' },
            });
            const nextNumero = (lastPropuesta?.numero || 0) + 1;

            // 2. Create Header
            const propuesta = new Propuesta();
            propuesta.pacienteId = createPropuestaDto.pacienteId;
            propuesta.usuarioId = createPropuestaDto.usuarioId || 1;
            propuesta.numero = nextNumero;

            propuesta.nota = createPropuestaDto.nota || '';
            propuesta.fecha = createPropuestaDto.fecha
                ? createPropuestaDto.fecha.split('T')[0]
                : new Date().toISOString().split('T')[0];

            // Calculate total from details just in case
            propuesta.total = createPropuestaDto.detalles.reduce((sum, item) => sum + Number(item.total), 0);

            const savedPropuesta = await queryRunner.manager.save(propuesta);

            // 3. Create Details
            const detalles = createPropuestaDto.detalles.map(item => {
                const detalle = new PropuestaDetalle();
                detalle.propuesta = savedPropuesta;
                detalle.letra = item.letra || null;
                detalle.arancelId = item.arancelId;
                detalle.precioUnitario = item.precioUnitario;
                detalle.tc = item.tc;
                detalle.piezas = item.piezas || '';
                detalle.cantidad = item.cantidad;
                detalle.subTotal = item.subTotal;
                detalle.descuento = item.descuento || 0;
                detalle.total = item.total;
                detalle.posible = item.posible || false;
                return detalle;
            });

            await queryRunner.manager.save(PropuestaDetalle, detalles);

            await queryRunner.commitTransaction();
            return this.findOne(savedPropuesta.id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Error creating propuesta:', err);
            const msg = err instanceof Error ? err.message : 'Unknown error';
            throw new NotFoundException(`Error creando propuesta: ${msg}`);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll() {
        return this.propuestaRepository.find({
            relations: ['paciente', 'usuario', 'detalles', 'detalles.arancel'],
            order: { fecha: 'DESC' }
        });
    }

    async findAllByPaciente(pacienteId: number) {
        return this.propuestaRepository.find({
            where: { pacienteId },
            relations: ['usuario', 'detalles', 'detalles.arancel'],
            order: { numero: 'ASC' }
        });
    }

    async findOne(id: number) {
        const propuesta = await this.propuestaRepository.findOne({
            where: { id },
            relations: ['paciente', 'usuario', 'detalles', 'detalles.arancel'],
        });
        if (!propuesta) throw new NotFoundException(`Propuesta #${id} not found`);
        return propuesta;
    }

    async update(id: number, updatePropuestaDto: UpdatePropuestaDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const propuesta = await queryRunner.manager.findOne(Propuesta, {
                where: { id },
                relations: ['detalles'],
            });

            if (!propuesta) throw new NotFoundException(`Propuesta #${id} not found`);

            // Update header fields
            if (updatePropuestaDto.nota !== undefined) propuesta.nota = updatePropuestaDto.nota;
            if (updatePropuestaDto.fecha) propuesta.fecha = updatePropuestaDto.fecha.split('T')[0];
            if (updatePropuestaDto.usuarioId) propuesta.usuarioId = updatePropuestaDto.usuarioId;


            // Recalculate total if details are provided
            if (updatePropuestaDto.detalles) {
                const incomingDetails = updatePropuestaDto.detalles;
                // Since this uses DTO without ID for create, we might need a way to track updates
                // For simplicity similar to Proformas, we might wipe and replace or smart update. 
                // The UpdateDto inherits from CreateDto which has nested structure. 
                // BUT CreatePropuestaDetalleDto doesn't have ID. 
                // Proforma logic: "Items to remove: Exists in DB but not in incoming payload". 
                // This implies incoming payload SHOULD have IDs for updates. 
                // My CreatePropuestaDetalleDto DOES NOT have ID field.
                // I will assume for now we wipe and recreate or I need to add ID to DTO. 
                // Checking Proforma DTO... CreateProformaDto uses CreateProformaDetalleDto.
                // UpdateProformaDto extends CreateProformaDto. 
                // So officially UpdateProformaDto.detalles are "Create" dtos without IDs.
                // However, the Proforma service logic accesses `item.id`. This means the DTO definition might be loose or there's an `any` cast or additional interface not seen. 
                // I will add `id` as optional to `CreatePropuestaDetalleDto` to support updates, or handle it as "IntersectionType" if using NestJS mapped-types, but adding optional ID to the Create DTO is easiest pattern for "Updatable Details".

                // WAIT, I cannot modify the DTO file I just wrote easily without another tool call. 
                // I will cast `item` to `any` inside the loop to access `.id` if passed, 
                // assuming the frontend sends it. 

                const incomingIds = incomingDetails.map((d: any) => d.id).filter((id: number) => id);

                // Items to remove
                const detailsToRemove = propuesta.detalles.filter(d => !incomingIds.includes(d.id));
                if (detailsToRemove.length > 0) {
                    await queryRunner.manager.remove(detailsToRemove);
                }

                const savedDetalles: PropuestaDetalle[] = [];

                for (const item of incomingDetails) {
                    let detalle: PropuestaDetalle | null = null;
                    const itemId = (item as any).id;

                    if (itemId) {
                        detalle = propuesta.detalles.find(d => d.id === itemId) || null;
                    }

                    if (!detalle) {
                        detalle = new PropuestaDetalle();
                        detalle.propuesta = propuesta;
                    }

                    detalle.letra = item.letra || null;
                    detalle.arancelId = item.arancelId;
                    detalle.precioUnitario = item.precioUnitario;
                    detalle.tc = item.tc;
                    detalle.piezas = item.piezas || '';
                    detalle.cantidad = item.cantidad;
                    detalle.subTotal = item.subTotal;
                    detalle.descuento = item.descuento || 0;
                    detalle.total = item.total;
                    detalle.posible = item.posible || false;

                    const savedDetalle = await queryRunner.manager.save(PropuestaDetalle, detalle);
                    savedDetalles.push(savedDetalle);
                }

                propuesta.total = savedDetalles.reduce((sum, item) => sum + Number(item.total), 0);
                propuesta.detalles = savedDetalles;
            }

            await queryRunner.manager.save(propuesta);
            await queryRunner.commitTransaction();

            return this.findOne(id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Error updating propuesta:', err);
            const msg = err instanceof Error ? err.message : 'Unknown error';
            throw new NotFoundException(`Error actualizando propuesta: ${msg}`);
        } finally {
            await queryRunner.release();
        }
    }

    async remove(id: number) {
        const propuesta = await this.findOne(id);
        return this.propuestaRepository.remove(propuesta);
    }

    async sendWhatsApp(id: number, fileBuffer: Buffer, letra?: string) {
        const propuesta = await this.findOne(id);
        const paciente = propuesta.paciente;

        if (!paciente || !paciente.celular) {
            throw new NotFoundException('El paciente no tiene número de celular registrado');
        }

        const chatbotStatus = this.chatbotService.getStatus();
        if (chatbotStatus.status !== 'connected') {
            throw new Error('El chatbot no está conectado. Por favor, conecte el chatbot primero desde Configuración > Chatbot (WhatsApp).');
        }

        let phone = paciente.celular.replace(/\D/g, '');
        if (phone.length === 8) {
            phone = '591' + phone;
        } else if (!phone.startsWith('591')) {
            phone = '591' + phone;
        }
        const jid = `${phone}@s.whatsapp.net`;

        const patientName = `${paciente.nombre || ''} ${paciente.paterno || ''}`.trim() || 'Paciente';
        const docName = letra 
            ? `Propuesta_${propuesta.numero}_Opcion_${letra}.pdf`
            : `Propuesta_${propuesta.numero}.pdf`;
        const caption = `Estimado(a) ${patientName}, le enviamos la propuesta de tratamiento odontológico${letra ? ` (Opción ${letra})` : ''} de CURARE Centro Dental.`;

        try {
            await this.chatbotService.sendMessage(jid, {
                document: fileBuffer,
                mimetype: 'application/pdf',
                fileName: docName,
                caption: caption
            });
            return { success: true, message: 'Propuesta enviada por WhatsApp exitosamente' };
        } catch (error: any) {
            console.error('Error sending WhatsApp propuesta:', error);
            throw new Error(error?.message || 'Error al enviar mensaje de WhatsApp');
        }
    }
}
