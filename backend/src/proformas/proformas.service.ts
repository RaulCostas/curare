import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateProformaDto } from './dto/create-proforma.dto';
import { UpdateProformaDto } from './dto/update-proforma.dto';
import { Proforma } from './entities/proforma.entity';
import { User } from '../users/entities/user.entity';
import { ProformaDetalle } from './entities/proforma-detalle.entity';
import { ProformaImagen } from './entities/proforma-imagen.entity';
import { UsersService } from '../users/users.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProformasService {
  constructor(
    @InjectRepository(Proforma)
    private readonly proformaRepository: Repository<Proforma>,
    @InjectRepository(ProformaDetalle)
    private readonly detalleRepository: Repository<ProformaDetalle>,
    @InjectRepository(ProformaImagen)
    private readonly imagenRepository: Repository<ProformaImagen>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ChatbotService))
    private readonly chatbotService: ChatbotService,
  ) { }

  async create(createProformaDto: CreateProformaDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get correlative number for patient
      const lastProforma = await queryRunner.manager.findOne(Proforma, {
        where: { pacienteId: createProformaDto.pacienteId },
        order: { numero: 'DESC' },
      });
      const nextNumero = (lastProforma?.numero || 0) + 1;

      // 2. Create Proforma Header
      const proforma = new Proforma();
      proforma.pacienteId = createProformaDto.pacienteId;
      proforma.usuarioId = createProformaDto.usuarioId;
      proforma.numero = nextNumero;
      proforma.nota = createProformaDto.nota || '';
      // Use provided fecha or default to current date
      proforma.fecha = createProformaDto.fecha
        ? createProformaDto.fecha.split('T')[0]
        : new Date().toISOString().split('T')[0];

      // 4. Approval fields
      proforma.aprobado = createProformaDto.aprobado || false;
      // Assign relation object for FK
      proforma.usuarioAprobado = createProformaDto.usuario_aprobado
        ? ({ id: createProformaDto.usuario_aprobado } as User)
        : null;

      proforma.fecha_aprobado = createProformaDto.fecha_aprobado
        ? createProformaDto.fecha_aprobado.split('T')[0]
        : null;

      // Calculate total from details
      const total = createProformaDto.detalles.reduce((sum, item) => sum + item.total, 0);
      proforma.total = total;

      const savedProforma = await queryRunner.manager.save(proforma);

      // 3. Create Details
      const detalles = createProformaDto.detalles.map(item => {
        const detalle = new ProformaDetalle();
        detalle.proforma = savedProforma;
        detalle.arancelId = item.arancelId;
        detalle.precioUnitario = item.precioUnitario;
        detalle.tc = item.tc;
        detalle.piezas = item.piezas || '';
        detalle.cantidad = item.cantidad;
        detalle.subTotal = item.subTotal;
        detalle.descuento = item.descuento;
        detalle.total = item.total;
        detalle.posible = item.posible;
        return detalle;
      });

      await queryRunner.manager.save(ProformaDetalle, detalles);

      await queryRunner.commitTransaction();
      return this.findOne(savedProforma.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating proforma:', err);
      // Construct a meaningful error message
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new NotFoundException(`Error creando proforma: ${msg}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(limit: number = 20, page: number = 1) {
    return this.proformaRepository.find({
      relations: ['paciente', 'usuario', 'usuarioAprobado', 'detalles', 'detalles.arancel'],
      order: { fecha: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });
  }

  async findAllByPaciente(pacienteId: number) {
    return this.proformaRepository.find({
      where: { pacienteId },
      relations: ['usuario', 'usuarioAprobado', 'detalles', 'detalles.arancel'],
      order: { numero: 'ASC' }
    });
  }

  async findOne(id: number) {
    const proforma = await this.proformaRepository.findOne({
      where: { id },
      relations: ['paciente', 'usuario', 'usuarioAprobado', 'detalles', 'detalles.arancel'],
    });
    if (!proforma) throw new NotFoundException(`Proforma #${id} not found`);
    return proforma;
  }

  async update(id: number, updateProformaDto: UpdateProformaDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const proforma = await queryRunner.manager.findOne(Proforma, {
        where: { id },
        relations: ['detalles'],
      });

      if (!proforma) throw new NotFoundException(`Proforma #${id} not found`);

      // Update header fields
      if (updateProformaDto.nota !== undefined) proforma.nota = updateProformaDto.nota;
      if (updateProformaDto.fecha) proforma.fecha = updateProformaDto.fecha.split('T')[0];
      if (updateProformaDto.usuarioId) proforma.usuarioId = updateProformaDto.usuarioId; // Update registered user

      if (updateProformaDto.aprobado !== undefined) proforma.aprobado = updateProformaDto.aprobado;
      if (updateProformaDto.usuario_aprobado !== undefined) {
        proforma.usuarioAprobado = updateProformaDto.usuario_aprobado
          ? ({ id: updateProformaDto.usuario_aprobado } as User)
          : null;
      }
      if (updateProformaDto.fecha_aprobado !== undefined) {
        proforma.fecha_aprobado = updateProformaDto.fecha_aprobado
          ? updateProformaDto.fecha_aprobado.split('T')[0]
          : null;
      }

      // Recalculate total if details are provided
      if (updateProformaDto.detalles) {
        // Smart Update Strategy:
        // 1. Identify which details to keep/update
        // 2. Identify which details to create
        // 3. Identify which details to remove

        const incomingDetails = updateProformaDto.detalles;
        const incomingIds = incomingDetails.filter(d => d.id).map(d => d.id);

        // Items to remove: Exists in DB but not in incoming payload
        const detailsToRemove = proforma.detalles.filter(d => !incomingIds.includes(d.id));

        if (detailsToRemove.length > 0) {
          // We attempt to remove. If this fails due to FK (item used in History), it will throw, 
          // which is expected (cannot delete used item), but at least we don't delete *everything*.
          await queryRunner.manager.remove(detailsToRemove);
        }

        const savedDetalles: ProformaDetalle[] = [];

        for (const item of incomingDetails) {
          let detalle: ProformaDetalle | null = null;

          if (item.id) {
            // Update existing
            detalle = proforma.detalles.find(d => d.id === item.id) || null;
          }

          if (!detalle) {
            // Create new
            detalle = new ProformaDetalle();
            detalle.proforma = proforma;
          }

          // Update fields
          detalle.arancelId = item.arancelId;
          detalle.precioUnitario = item.precioUnitario;
          detalle.tc = item.tc;
          detalle.piezas = item.piezas || '';
          detalle.cantidad = item.cantidad;
          detalle.subTotal = item.subTotal;
          detalle.descuento = item.descuento;
          detalle.total = item.total;
          detalle.posible = item.posible;

          const savedDetalle = await queryRunner.manager.save(ProformaDetalle, detalle);
          savedDetalles.push(savedDetalle);
        }

        // Update proforma total
        proforma.total = savedDetalles.reduce((sum, item) => sum + item.total, 0);

        // Update reference for return
        proforma.detalles = savedDetalles;
      }

      await queryRunner.manager.save(proforma);
      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Error updating proforma:', err);
      // Construct a meaningful error message
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new NotFoundException(`Error actualizando proforma: ${msg}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const proforma = await this.findOne(id);
    return this.proformaRepository.remove(proforma);
  }

  async approve(id: number, codigo: string) {
    // 1. Find user by approval code (codigo_proforma)
    // Note: codigo_proforma is a number in User entity, but input is string
    const users = await this.usersService.findAll(); // Optimization: Add findByCode in UsersService is better, but findAll works for small lists
    const user = users.find(u => u.codigo_proforma === Number(codigo));

    if (!user) {
      throw new NotFoundException('Código de aprobación incorrecto');
    }

    // 2. Update Proforma
    const proforma = await this.findOne(id);
    proforma.aprobado = true;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    proforma.fecha_aprobado = `${year}-${month}-${day}`;
    proforma.usuarioAprobado = user;

    return this.proformaRepository.save(proforma);
  }

  async uploadImage(proformaId: number, filename: string, ruta: string) {
    const proforma = await this.findOne(proformaId);
    const imagen = new ProformaImagen();
    imagen.proforma = proforma;
    imagen.nombre_archivo = filename;
    imagen.ruta = ruta;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    imagen.fecha_creacion = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}` as any;

    return this.imagenRepository.save(imagen);
  }

  async getImages(proformaId: number) {
    return this.imagenRepository.find({
      where: { proformaId },
      order: { fecha_creacion: 'DESC' }
    });
  }

  async updateImageDescription(id: number, descripcion: string) {
    const imagen = await this.imagenRepository.findOne({ where: { id } });
    if (!imagen) throw new NotFoundException('Imagen no encontrada');
    imagen.descripcion = descripcion;
    return this.imagenRepository.save(imagen);
  }

  async removeImage(id: number) {
    const imagen = await this.imagenRepository.findOne({ where: { id } });
    if (!imagen) throw new NotFoundException('Imagen no encontrada');

    // Remove file from disk
    if (fs.existsSync(imagen.ruta)) {
      try {
        fs.unlinkSync(imagen.ruta);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }

    return this.imagenRepository.remove(imagen);
  }

  async sendWhatsApp(id: number, fileBuffer: Buffer) {
    const proforma = await this.findOne(id);
    const paciente = proforma.paciente;

    if (!paciente || !paciente.celular) {
      throw new NotFoundException('El paciente no tiene número de celular registrado');
    }

    // Clean phone number
    let phone = paciente.celular.replace(/\D/g, '');
    if (!phone.startsWith('591')) {
      phone = '591' + phone;
    }
    const jid = `${phone}@s.whatsapp.net`;

    try {
      await this.chatbotService.sendMessage(jid, {
        document: fileBuffer,
        mimetype: 'application/pdf',
        fileName: `Presupuesto_${proforma.numero}.pdf`,
        caption: `Hola ${paciente.nombre}, aquí tiene el detalle de su presupuesto (N° ${proforma.numero}).`
      });
      return { success: true, message: 'Enviado correctamente' };
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      throw new Error('Error al enviar mensaje de WhatsApp');
    }
  }
}
