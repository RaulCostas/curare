import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Informe } from './entities/informe.entity';
import { CreateInformeDto, UpdateInformeDto } from './dto/informe.dto';
import { InformesPdfService } from './informes-pdf.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { formatWhatsAppJid } from '../common/utils/phone.utils';

@Injectable()
export class InformesService {
    constructor(
        @InjectRepository(Informe)
        private informesRepository: Repository<Informe>,
        private readonly informesPdfService: InformesPdfService,
        private readonly chatbotService: ChatbotService,
    ) {}

    async create(createInformeDto: CreateInformeDto) {
        const informe = this.informesRepository.create(createInformeDto);
        const saved = await this.informesRepository.save(informe);
        return this.findOne(saved.id);
    }

    findAll() {
        return this.informesRepository.find({
            relations: ['paciente', 'user', 'doctor', 'doctor.especialidad'],
            order: { fecha: 'DESC', id: 'DESC' }
        });
    }

    findByPaciente(pacienteId: number) {
        return this.informesRepository.find({
            where: { pacienteId },
            relations: ['paciente', 'user', 'doctor', 'doctor.especialidad'],
            order: { fecha: 'DESC', id: 'DESC' }
        });
    }

    async findOne(id: number) {
        const informe = await this.informesRepository.findOne({
            where: { id },
            relations: ['paciente', 'user', 'doctor', 'doctor.especialidad']
        });
        if (!informe) {
            throw new NotFoundException(`Informe con id ${id} no encontrado`);
        }
        return informe;
    }

    async update(id: number, updateInformeDto: UpdateInformeDto) {
        const informe = await this.findOne(id);
        Object.assign(informe, updateInformeDto);
        await this.informesRepository.save(informe);
        return this.findOne(id);
    }

    async remove(id: number) {
        const informe = await this.findOne(id);
        return this.informesRepository.remove(informe);
    }

    async sendWhatsApp(id: number, fileBuffer?: Buffer | null) {
        const informe = await this.findOne(id);
        if (!informe) {
            throw new NotFoundException(`Informe con id ${id} no encontrado`);
        }

        const paciente = informe.paciente;
        if (!paciente || !paciente.celular) {
            throw new BadRequestException('El paciente no tiene un número de celular registrado.');
        }

        const chatbotStatus = this.chatbotService.getStatus();
        if (chatbotStatus.status !== 'connected') {
            throw new HttpException(
                'El chatbot no está conectado. Por favor, conecte el chatbot primero desde Configuración > Chatbot (WhatsApp).',
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }

        const jid = formatWhatsAppJid(paciente.celular);
        if (!jid) {
            throw new BadRequestException('El número de celular del paciente no es válido.');
        }

        const pdfBuffer = fileBuffer || await this.informesPdfService.generateInformePdf(informe);

        const safeTitle = (informe.titulo || 'Informe_Odontologico').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const patientName = `${paciente.nombre || ''} ${paciente.paterno || ''}`.trim() || 'Paciente';

        try {
            await this.chatbotService.sendMessage(jid, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `${safeTitle}_${informe.id}.pdf`,
                caption: `Estimado(a) ${patientName}, le enviamos su ${informe.titulo || 'Informe Odontológico'} emitido por CURARE Centro Dental.`
            });

            return { success: true, message: 'Informe enviado por WhatsApp exitosamente' };
        } catch (error: any) {
            console.error('Error sending WhatsApp informe:', error);
            throw new HttpException(
                error.message || 'Error al enviar el informe por WhatsApp',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
