import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PacientesService } from '../pacientes/pacientes.service';
import { DoctorsService } from '../doctors/doctors.service';
import { AgendaService } from '../agenda/agenda.service';
import { PagosService } from '../pagos/pagos.service';
import { ProformasService } from '../proformas/proformas.service';
import { HistoriaClinicaService } from '../historia_clinica/historia_clinica.service';
import { PersonalService } from '../personal/personal.service';
import { EspecialidadService } from '../especialidad/especialidad.service';
import { ChatbotIntentosService } from './chatbot-intentos.service';
import { ChatbotIntento } from './entities/chatbot-intento.entity';
import { WhatsappSession } from './entities/whatsapp-session.entity';
import { ChatbotPdfService } from './chatbot-pdf.service';
import { deduplicateHistoria } from '../utils/historia-utils';
import { InventarioService } from '../inventario/inventario.service';
import { DatosCentroDentalService } from '../datos_centro_dental/datos_centro_dental.service';
import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';

// @ts-ignore
import { decryptPollVote } from '@whiskeysockets/baileys/lib/Utils/process-message.js';
// @ts-ignore
import { getKeyAuthor } from '@whiskeysockets/baileys/lib/Utils/generics.js';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

interface SessionState {
    sock: any;
    qrCode: string | null;
    status: 'disconnected' | 'connecting' | 'connected' | 'qr';
    intentionalDisconnect: boolean;
    initializationStartTime: number | null;
    initializationTimeout: NodeJS.Timeout | null;
    userSessions: Map<string, { type: string, timestamp: number, citaId?: number }>;
    pollStore: Map<string, { message: any, citaId: number }>;
}

@Injectable()
export class ChatbotService implements OnModuleInit, OnModuleDestroy {
    private sessions = new Map<number, SessionState>();

    constructor(
        private readonly pacientesService: PacientesService,
        private readonly agendaService: AgendaService,
        private readonly pagosService: PagosService,
        @Inject(forwardRef(() => ProformasService))
        private readonly proformasService: ProformasService,
        private readonly historiaClinicaService: HistoriaClinicaService,
        private readonly intentosService: ChatbotIntentosService,
        private readonly pdfService: ChatbotPdfService,
        private readonly doctorsService: DoctorsService,
        private readonly inventarioService: InventarioService,
        private readonly personalService: PersonalService,
        private readonly especialidadService: EspecialidadService,
        private readonly datosCentroDentalService: DatosCentroDentalService,
        private readonly dataSource: DataSource,
        @InjectRepository(WhatsappSession)
        private readonly whatsappSessionRepository: Repository<WhatsappSession>,
    ) { }

    private getSession(): SessionState {
        if (!this.sessions.has(1)) {
            this.sessions.set(1, {
                sock: null,
                qrCode: null,
                status: 'disconnected',
                intentionalDisconnect: false,
                initializationStartTime: null,
                initializationTimeout: null,
                userSessions: new Map(),
                pollStore: new Map(),
            });
        }
        return this.sessions.get(1)!;
    }

    async onModuleInit() {
        console.log('[Chatbot] Starting initialization...');
        this.initialize().catch(err => {
            console.error(`[Chatbot] Failed to initialize session:`, err);
        });
    }

    async onModuleDestroy() {
        for (const [clinicId, session] of this.sessions.entries()) {
            if (session.sock) {
                try {
                    session.sock.end(undefined);
                } catch (e) { }
            }
        }
    }

    async initialize() {
        const session = this.getSession();
        if (session.status === 'connected' || session.status === 'connecting') {
            console.log(`[Chatbot] [CURARE] Already connected or connecting. Skipping initialization.`);
            return;
        }

        session.intentionalDisconnect = false;
        session.status = 'connecting';
        session.initializationStartTime = Date.now();

        if (session.initializationTimeout) {
            clearTimeout(session.initializationTimeout);
        }

        session.initializationTimeout = setTimeout(() => {
            if (session.status === 'connecting') {
                console.log(`[Chatbot] [CURARE] Initialization timeout - resetting to disconnected`);
                session.status = 'disconnected';
                session.qrCode = null;
                session.initializationStartTime = null;
                if (session.sock) {
                    try {
                        session.sock.end(undefined);
                    } catch (error) {
                        console.error(`[Chatbot] [CURARE] Error ending socket on timeout:`, error);
                    }
                }
            }
        }, 60000);

        try {
            const { state, saveCreds } = await this.useDatabaseAuthState(1);

            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`[Chatbot] [CURARE] Initializing (WA version: ${version.join('.')}, isLatest: ${isLatest})...`);

            session.sock = makeWASocket({
                version,
                logger: pino({ level: 'error' }) as any,
                auth: {
                    creds: state.creds,
                    keys: state.keys,
                },
                generateHighQualityLinkPreview: true,
                browser: ['CURARE Chatbot', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                retryRequestDelayMs: 250,
                getMessage: async (key) => {
                    if (key.id && session.pollStore.has(key.id)) {
                        return session.pollStore.get(key.id)!.message;
                    }
                    return undefined;
                }
            });

            console.log(`[Chatbot] [CURARE] Socket created. Setting up event listeners...`);

            session.sock.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;
                const elapsed = session.initializationStartTime ? Date.now() - session.initializationStartTime : 0;
                console.log(`[Chatbot] [CURARE] Connection Update:`, { connection, qr: qr ? 'QR RECEIVED' : 'NO QR', elapsed: `${elapsed}ms` });

                if (qr) {
                    session.status = 'qr';
                    session.qrCode = await QRCode.toDataURL(qr);
                    console.log(`[Chatbot] [CURARE] QR Code generated`);

                    if (session.initializationTimeout) {
                        clearTimeout(session.initializationTimeout);
                        session.initializationTimeout = null;
                    }
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                    const errorMsg = lastDisconnect?.error?.message || 'Unknown error';
                    console.log(`[Chatbot] [CURARE] Connection closed. Reconnecting:`, shouldReconnect, 'Error:', errorMsg);
                    session.status = 'disconnected';
                    session.qrCode = null;
                    session.initializationStartTime = null;

                    if (session.initializationTimeout) {
                        clearTimeout(session.initializationTimeout);
                        session.initializationTimeout = null;
                    }

                    if (shouldReconnect && !session.intentionalDisconnect) {
                        this.initialize();
                    } else {
                        console.log(`[Chatbot] [CURARE] Logged out or Intentional Disconnect.`);
                    }
                } else if (connection === 'open') {
                    console.log(`[Chatbot] [CURARE] Connection opened successfully`);
                    session.status = 'connected';
                    session.qrCode = null;
                    session.initializationStartTime = null;

                    if (session.initializationTimeout) {
                        clearTimeout(session.initializationTimeout);
                        session.initializationTimeout = null;
                    }
                }
            });

            session.sock.ev.on('creds.update', saveCreds);

            session.sock.ev.on('messages.upsert', async (m: any) => {
                for (const msg of m.messages) {
                    const pollUpdateMessage = msg.message?.pollUpdateMessage || msg.message?.messageContextInfo?.message?.pollUpdateMessage;
                    if (pollUpdateMessage) {
                        try {
                            const creationMsgKey = pollUpdateMessage.pollCreationMessageKey;
                            if (session.pollStore.has(creationMsgKey.id)) {
                                const { message: pollMsg, citaId } = session.pollStore.get(creationMsgKey.id)!;

                                const meIdNormalised = jidNormalizedUser(session.sock?.user?.id || '');
                                const pollCreatorJid = getKeyAuthor(creationMsgKey, meIdNormalised);
                                const voterJid = getKeyAuthor(msg.key, meIdNormalised);
                                const pollEncKey = pollMsg.messageContextInfo?.messageSecret!;

                                const voteMsg = decryptPollVote(
                                    pollUpdateMessage.vote as any,
                                    {
                                        pollEncKey,
                                        pollCreatorJid,
                                        pollMsgId: creationMsgKey.id!,
                                        voterJid,
                                    }
                                );

                                if (voteMsg.selectedOptions && voteMsg.selectedOptions.length > 0) {
                                    const selectedOption = voteMsg.selectedOptions[0];
                                    await this.handleAgendaPollResponse(selectedOption as any, citaId, msg.key.remoteJid!);
                                }
                            }
                        } catch (err) {
                            console.error('[Chatbot] [CURARE] Error processing poll vote:', err);
                        }
                    }

                    if (msg.key.fromMe) continue;
                    await this.handleMessage(msg);
                }
            });

        } catch (error) {
            console.error(`[Chatbot] [CURARE] Critical Error initializing Baileys:`, error);
            session.status = 'disconnected';
            session.qrCode = null;
            session.initializationStartTime = null;

            if (session.initializationTimeout) {
                clearTimeout(session.initializationTimeout);
                session.initializationTimeout = null;
            }
        }
    }

    private async useDatabaseAuthState(clinicId: number = 1) {
        const { BufferJSON, initAuthCreds } = await import('@whiskeysockets/baileys');
        let creds: any;

        const sessionCreds = await this.whatsappSessionRepository.findOne({
            where: { type: 'creds' }
        });

        if (sessionCreds) {
            creds = JSON.parse(JSON.stringify(sessionCreds.data), BufferJSON.reviver);
        } else {
            creds = initAuthCreds();
        }

        const saveCreds = async () => {
            const existing = await this.whatsappSessionRepository.findOne({
                where: { type: 'creds' }
            });
            const serializedCreds = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
            if (existing) {
                existing.data = serializedCreds;
                await this.whatsappSessionRepository.save(existing);
            } else {
                const newSession = this.whatsappSessionRepository.create({
                    type: 'creds',
                    data: serializedCreds
                });
                await this.whatsappSessionRepository.save(newSession);
            }
        };

        return {
            state: {
                creds,
                keys: {
                    get: async (type: string, ids: string[]) => {
                        const data: { [id: string]: any } = {};
                        await Promise.all(
                            ids.map(async (id) => {
                                const typeKey = `key-${type}`;
                                const key = await this.whatsappSessionRepository.findOne({
                                    where: { type: typeKey, keyId: id }
                                });
                                if (key) {
                                    let value = JSON.parse(JSON.stringify(key.data), BufferJSON.reviver);
                                    data[id] = value;
                                }
                            })
                        );
                        return data;
                    },
                    set: async (data: any) => {
                        for (const type in data) {
                            for (const id in data[type]) {
                                const value = data[type][id];
                                const typeKey = `key-${type}`;
                                const existing = await this.whatsappSessionRepository.findOne({
                                    where: { type: typeKey, keyId: id }
                                });

                                if (value) {
                                    const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
                                    if (existing) {
                                        existing.data = serialized;
                                        await this.whatsappSessionRepository.save(existing);
                                    } else {
                                        const newKey = this.whatsappSessionRepository.create({
                                            type: typeKey,
                                            keyId: id,
                                            data: serialized
                                        });
                                        await this.whatsappSessionRepository.save(newKey);
                                    }
                                } else {
                                    if (existing) {
                                        await this.whatsappSessionRepository.remove(existing);
                                    }
                                }
                            }
                        }
                    }
                }
            },
            saveCreds
        };
    }

    async handleMessage(msg: any) {
        const session = this.getSession();
        let remoteJid = msg.key?.remoteJid;

        if (remoteJid?.endsWith('@lid') && msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
            console.log(`[Chatbot] [CURARE] Normalized @lid incoming message to: ${msg.key.remoteJidAlt}`);
            remoteJid = msg.key.remoteJidAlt;
        }

        if (!remoteJid) {
            console.log(`[Chatbot] [CURARE] No remoteJid found, skipping.`);
            return;
        }

        let senderJid = msg.key.participant || remoteJid;

        if (senderJid.endsWith('@lid') && msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
            senderJid = msg.key.remoteJidAlt;
        }

        const phonePart = senderJid.split('@')[0];
        const phone = phonePart.split(':')[0];
        const isGroup = remoteJid.endsWith('@g.us');

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const normalizedText = text.toLowerCase();

        console.log(`[Chatbot] [CURARE] New message from ${senderJid} in ${remoteJid}: "${text}"`);

        // ─── PRIORIDAD 1: Sesiones de espera activas ─────
        const currentSession = session.userSessions.get(remoteJid);

        if (currentSession && currentSession.type === 'waiting_agenda_response' && currentSession.citaId) {
            const respuesta = normalizedText.trim();
            if (respuesta === 'a') {
                try {
                    await this.agendaService.update(currentSession.citaId, { estado: 'confirmado' } as any);
                    await this.sendMessage(remoteJid, '¡Gracias! Tu cita ha sido confirmada satisfactoriamente. ✅');
                } catch (err) {
                    await this.sendMessage(remoteJid, 'Ocurrió un error al confirmar tu cita. Por favor, contáctanos directamente.');
                }
                session.userSessions.delete(remoteJid);
                return;
            } else if (respuesta === 'b') {
                try {
                    await this.agendaService.update(currentSession.citaId, { estado: 'cancelado' } as any);
                    await this.sendMessage(remoteJid, 'Por favor, comuníquese con la Clínica para agendar su cita en otra fecha y horario');
                } catch (err) {}
                session.userSessions.delete(remoteJid);
                return;
            } else {
                await this.sendMessage(remoteJid, 'Por favor responde *A* para confirmar o *B* para cancelar tu cita.');
                return;
            }
        }

        // ─── PRIORIDAD 2: Detener si es un grupo ──────────────────────────────────
        if (isGroup) return;

        // ─── PRIORIDAD 3: Intents y lógica regular ────────────────────────────────
        const intents = await this.intentosService.findAllActive();
        let matchedIntent: ChatbotIntento | null = null;
        let bestMatchKeyword = '';

        for (const intent of intents) {
            const keywords = intent.keywords.toLowerCase().split(',').map(k => k.trim());
            const matchedKeyword = keywords.find(k => {
                const safeK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${safeK}\\b`, 'i');
                return regex.test(normalizedText);
            });

            if (matchedKeyword && matchedKeyword.length > bestMatchKeyword.length) {
                bestMatchKeyword = matchedKeyword;
                matchedIntent = intent;
            }
        }

        let actor: any = null;
        let isDoctor = false;

        const phoneVariations = [
            phone,
            phone.startsWith('591') ? phone.substring(3) : '591' + phone,
            '+' + phone,
            phone.startsWith('591') ? '+' + phone : '+591' + phone
        ];

        if (matchedIntent?.target === 'USUARIO') {
            for (const p of phoneVariations) {
                actor = await this.doctorsService.findByCelular(p);
                if (actor) { isDoctor = true; break; }
            }
            if (!actor) {
                for (const p of phoneVariations) {
                    actor = await this.personalService.findByCelular(p);
                    if (actor) break;
                }
            }
            if (!actor) {
                return;
            }
        } else {
            for (const p of phoneVariations) {
                actor = await this.pacientesService.findByCelular(p);
                if (actor) break;
            }
        }

        const menuSession = session.userSessions.get(remoteJid);
        const options = ['1', '2', '3', '4'];
        const currentOption = normalizedText.trim();
        const isOption = options.includes(currentOption);
        const isSessionValid = menuSession && (Date.now() - menuSession.timestamp < 300000);

        if (isOption && isSessionValid && menuSession.type) {
            await this.handleMenuOption(remoteJid, currentOption, actor, menuSession.type);
            return;
        }

        if (matchedIntent) {
            try {
                switch (matchedIntent.action) {
                    case 'MENU_PRINCIPAL' as any:
                        if (actor) {
                            await this.sendSubmenuRegistered(remoteJid, actor);
                        } else {
                            await this.sendSubmenuNew(remoteJid);
                        }
                        break;
                    case 'CONSULTAR_CITA_HOY':
                        if (isDoctor) {
                            await this.checkDoctorAppointmentsToday(actor, remoteJid);
                        }
                        break;

                    case 'CONSULTAR_INVENTARIO' as any:
                        await this.handleConsultarInventario(remoteJid, normalizedText);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                console.error('[Chatbot] Error in matchedIntent:', error);
            }
        }
    }

    async sendMenu(remoteJid: string) {
        const session = this.getSession();
        const message = `¡Hola! 👋 Te damos la bienvenida al Consultorio Dental CURARE. \n\n` +
            `*Menú:*\n` +
            `*1* Ya soy paciente del consultorio\n` +
            `*2* Es mi primera vez aquí / Soy nuevo paciente\n` +
            `*3* Urgencia\n\n` +
            `Por favor, responde con el número de la opción que desees.\n` +
            `📌 Guarda nuestro número.`;

        await this.sendMessage(remoteJid, message);
        session.userSessions.set(remoteJid, { type: 'root_menu', timestamp: Date.now() });
    }

    async sendSubmenuRegistered(remoteJid: string, actor: any) {
        const session = this.getSession();
        const nombre = actor ? `${actor.nombre || ''} ${actor.paterno || ''}`.trim() : 'estimado paciente';
        const message = `¡Qué gusto atenderte de nuevo ${nombre}! 😊 ¿En qué te podemos ayudar?\n\n` +
            `*Menú:*\n` +
            `*1* 🗓️ Agendar o reprogramar mi cita\n` +
            `*2* 🦷 Consultar sobre mi tratamiento actual\n` +
            `*3* 💳 Consultar mi estado de cuentas\n` +
            `*4* 📅 Consultar mis citas programadas\n\n` +
            `Por favor, responde con el número de la opción elegida.`;

        await this.sendMessage(remoteJid, message);
        session.userSessions.set(remoteJid, { type: 'submenu_registered', timestamp: Date.now() });
    }

    async sendSubmenuNew(remoteJid: string) {
        const session = this.getSession();
        const message = `¡Bienvenido a CURARE CENTRO DENTAL! 🦷 Nos encantará cuidar de tu salud bucodental. ¿En qué te podemos ayudar?\n\n` +
            `*Menú:*\n` +
            `*1* 📍 Dirección y ubicación del consultorio\n` +
            `*2* 🕒 Horarios de atención\n` +
            `*3* 📝 Agendar mi primera consulta\n\n` +
            `Por favor, responde con el número de la opción elegida.`;

        await this.sendMessage(remoteJid, message);
        session.userSessions.set(remoteJid, { type: 'submenu_new', timestamp: Date.now() });
    }

    async handleMenuOption(remoteJid: string, option: string, actor: any, sessionType: string) {
        const session = this.getSession();

        if (sessionType === 'root_menu') {
            if (option === '1') {
                if (actor) {
                    await this.sendSubmenuRegistered(remoteJid, actor);
                } else {
                    await this.sendMessage(remoteJid, 'No encontramos tu número registrado como paciente en nuestro sistema. Sin embargo, con gusto podemos agendar tu cita.');
                    await this.sendSubmenuNew(remoteJid);
                }
            } else if (option === '2') {
                await this.sendSubmenuNew(remoteJid);
            } else if (option === '3') {
                await this.sendMessage(remoteJid, '🚨 *Atención de Urgencia:* Si tienes un dolor intenso o una emergencia dental, por favor llámanos directamente o visítanos inmediatamente.');
                session.userSessions.delete(remoteJid);
            }
        } else if (sessionType === 'submenu_registered') {
            if (option === '1') {
                await this.sendMessage(remoteJid, 'Para agendar o reprogramar tu cita, comunícate con recepción o déjanos el día y hora que prefieres y te responderemos a la brevedad.');
            } else if (option === '2') {
                await this.sendMessage(remoteJid, 'Un asistente o doctor revisará tu tratamiento y te responderá en breve.');
            } else if (option === '3') {
                if (actor) {
                    await this.sendEstadoCuentasPdfs(remoteJid, actor);
                }
            } else if (option === '4') {
                if (actor) {
                    await this.checkAppointments(actor, remoteJid);
                }
            }
            session.userSessions.delete(remoteJid);
        } else if (sessionType === 'submenu_new') {
            if (option === '1') {
                const cds = await this.datosCentroDentalService.findAll();
                const cd = cds && cds.length > 0 ? cds[0] : null;
                if (cd) {
                    if (cd.direccion) {
                        await this.sendMessage(remoteJid, cd.direccion);
                    }
                    if (cd.latitud && cd.longitud) {
                        try {
                            await session.sock.sendMessage(remoteJid, {
                                location: {
                                    degreesLatitude: Number(cd.latitud),
                                    degreesLongitude: Number(cd.longitud),
                                }
                            });
                        } catch (e) {
                            console.error('[Chatbot] Error enviando ubicación:', e);
                        }
                    } else {
                        await this.sendMessage(remoteJid, '📍 Nos encontramos en la clínica. Te esperamos.');
                    }
                } else {
                    await this.sendMessage(remoteJid, '📍 Nos encontramos en la clínica. Te esperamos.');
                }
            } else if (option === '2') {
                const cds = await this.datosCentroDentalService.findAll();
                const cd = cds && cds.length > 0 ? cds[0] : null;
                if (cd && cd.horarios) {
                    await this.sendMessage(remoteJid, cd.horarios);
                } else {
                    await this.sendMessage(remoteJid, '🕒 Nuestro horario de atención es de Lunes a Viernes.');
                }
            } else if (option === '3') {
                await this.sendMessage(remoteJid, 'Por favor déjanos tu nombre completo y el motivo de consulta para agendar tu primera cita.');
            }
            session.userSessions.delete(remoteJid);
        }
    }

    async sendEstadoCuentasPdfs(remoteJid: string, paciente: any): Promise<void> {
        const proformas = await this.proformasService.findAllByPaciente(paciente.id);
        const pagos = await this.pagosService.findAllByPaciente(paciente.id);
        const historia = await this.historiaClinicaService.findAllByPaciente(paciente.id);

        if (!proformas || proformas.length === 0) {
            await this.sendMessage(remoteJid, "No tiene presupuestos registrados en el sistema / .");
            return;
        }

        const proformaGroups = proformas.map(p => {
            const h = historia.filter((hist: any) => hist.proformaId === p.id);
            const pg = pagos.filter((pago: any) => pago.proformaId === p.id);
            
            const rawFilteredH = h.filter((hist: any) => hist.estadoTratamiento === 'terminado');
            const deduplicatedH = deduplicateHistoria(rawFilteredH);
            
            const totalEjecutado = deduplicatedH.reduce((acc, curr) => acc + Number(curr.precio || 0), 0);
            
            const totalPagado = pg.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
            const diff = totalEjecutado - totalPagado;
            const saldoPendiente = diff > 0 ? diff : 0;

            return {
                proforma: p,
                historias: deduplicateHistoria(h),
                pagos: pg,
                totalEjecutado,
                totalPagado,
                saldoPendiente
            };
        });

        // Send a PDF for each proforma independently
        for (const group of proformaGroups) {
            try {
                const pdfBuffer = await this.pdfService.generateEstadoCuentaPdf(paciente, [group]);
                const base64 = pdfBuffer.toString('base64');
                await this.sendPdf(remoteJid, base64, `Estado_Cuenta_Plan_${group.proforma.numero || group.proforma.id}.pdf`);
            } catch (err) {
                console.error('[Chatbot] Error generating PDF for proforma:', group.proforma.id, err);
            }
        }

        // Send QR
        try {
            const cds = await this.datosCentroDentalService.findAll();
            const cd = cds && cds.length > 0 ? cds[0] : null;
            if (cd && cd.qr) {
                await this.sendMedia(remoteJid, cd.qr, 'Aquí le compartimos nuestro código QR para transferencias.');
            }
        } catch (err) {
            console.error('[Chatbot] Error sending QR:', err);
        }
    }

    async checkAppointments(paciente: any, remoteJid: string) {
        const appointments = await this.agendaService.findAllByPaciente(paciente.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureAppointments = appointments.filter(a => {
            const [year, month, day] = a.fecha.toString().split('-').map(Number);
            const appDateObj = new Date(year, month - 1, day);
            return appDateObj >= today;
        });

        if (futureAppointments.length > 0) {
            const replies = futureAppointments.map(app => {
                const timeParts = app.hora.split(':');
                const timeFormatted = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : app.hora;
                const dateParts = app.fecha.toString().split('-');
                let dateFormatted = app.fecha;
                if (dateParts.length === 3) {
                    dateFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // dd/mm/aaaa
                }
                return `📅 ${dateFormatted} 🕒 ${timeFormatted}`;
            });

            const reply = `Hola ${paciente.nombre}, tienes las siguientes citas programadas:\n\n${replies.join('\n')}`;
            await this.sendMessage(remoteJid, reply);
        } else {
            const reply = `Hola ${paciente.nombre}, no encontré citas futuras agendadas.`;
            await this.sendMessage(remoteJid, reply);
        }
    }

    async checkDoctorAppointmentsToday(doctor: any, remoteJid: string) {
        const appointments = await this.agendaService.findAllByDoctor(doctor.id);

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const todayAppointments = appointments.filter(a => a.fecha === todayStr && a.estado === 'confirmado');

        if (todayAppointments.length > 0) {
            const replies = todayAppointments.map(app => {
                const timeParts = app.hora.split(':');
                const timeFormatted = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : app.hora;
                const pacienteName = app.paciente ? `${app.paciente.nombre} ${app.paciente.paterno}` : 'Paciente sin nombre';
                return `📅 ${app.fecha} 🕒 ${timeFormatted}\n👤 ${pacienteName}\n📝 ${app.tratamiento || 'Consulta'}`;
            });
            const reply = `Dr. ${doctor.paterno}, sus citas para HOY:\n\n${replies.join('\n\n')}`;
            await this.sendMessage(remoteJid, reply);
        }
    }

    async sendBirthdayGreeting(pacienteId: number) {
        const paciente = await this.pacientesService.findOne(pacienteId);
        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }

        let rawPhone = (paciente as any).telefono_celular || paciente.celular || paciente.telefono;
        let celular = rawPhone?.replace(/\D/g, '');
        if (!celular) {
            throw new Error('El paciente no tiene número de celular registrado');
        }

        if (!celular.startsWith('591') && celular.length === 8) {
            celular = `591${celular}`;
        }
        const jid = `${celular}@s.whatsapp.net`;
        const clinicaText = 'CURARE';
        const nombreCompleto = [paciente.nombre, paciente.paterno, paciente.materno].filter(Boolean).join(' ');
        const text = `¡Hola ${nombreCompleto}! 🎉 En nombre de todo el equipo de ${clinicaText}, te deseamos un muy feliz cumpleaños. ¡Que tengas un excelente día! 🎂🎈\n\n📌 Por favor guarda nuestro número para recibir tus felicitaciones y recordatorios.`;

        await this.sendMessage(jid, text);
        return { success: true };
    }

    async sendMessage(jid: string, content: string | any) {
        const session = this.getSession();
        if (session.status !== 'connected' || !session.sock) {
            console.warn(`[Chatbot] [CURARE] Cannot send message to ${jid}: Not connected (status: ${session.status})`);
            throw new Error('El chatbot no está conectado a WhatsApp');
        }

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            const delayMs = Math.floor(Math.random() * 5000) + 3000;
            await new Promise(resolve => setTimeout(resolve, delayMs));
            await session.sock.sendPresenceUpdate('paused', jid);

            if (typeof content === 'string') {
                await session.sock.sendMessage(jid, { text: content });
            } else {
                await session.sock.sendMessage(jid, content);
            }
        } catch (error) {
            console.error(`[Chatbot] [CURARE] Error sending message:`, error);
            throw error;
        }
    }

    async sendPdf(jid: string, base64: string, fileName: string, caption?: string) {
        const buffer = Buffer.from(base64, 'base64');
        await this.sendMessage(jid, {
            document: buffer,
            mimetype: 'application/pdf',
            fileName: fileName,
            caption: caption || ''
        });
    }

    async sendMedia(jid: string, filename: string, caption?: string) {
        const session = this.getSession();
        if (session.status !== 'connected' || !session.sock) {
            throw new Error('El chatbot no está conectado a WhatsApp');
        }

        const filePath = path.join(process.cwd(), 'uploads', filename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`El archivo ${filename} no fue encontrado en el servidor.`);
        }

        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();

        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            await this.sendMessage(jid, {
                image: buffer,
                caption: caption || ''
            });
        } else {
            let mimetype = 'application/pdf';
            if (ext === '.doc' || ext === '.docx') mimetype = 'application/msword';

            await this.sendMessage(jid, {
                document: buffer,
                mimetype,
                fileName: filename,
                caption: caption || ''
            });
        }
    }

    async sendAgendaPoll(jid: string, pollName: string, options: string[], citaId: number) {
        const session = this.getSession();
        if (session.status !== 'connected' || !session.sock) {
            console.warn(`[Chatbot] [CURARE] Cannot send poll to ${jid}: Not connected`);
            throw new Error('El chatbot no está conectado a WhatsApp');
        }

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            const delayMs = Math.floor(Math.random() * 5000) + 3000;
            await new Promise(resolve => setTimeout(resolve, delayMs));
            await session.sock.sendPresenceUpdate('paused', jid);

            const msg = await session.sock.sendMessage(jid, {
                poll: {
                    name: pollName,
                    values: options,
                    selectableCount: 1
                }
            });
            session.pollStore.set(msg?.key?.id, { message: msg.message, citaId });
            return msg;
        } catch (error) {
            console.error(`[Chatbot] [CURARE] Error sending poll:`, error);
            throw error;
        }
    }

    async sendAgendaMenu(jid: string, mensajeIntro: string, citaId: number): Promise<void> {
        const session = this.getSession();
        const menuTexto = `${mensajeIntro}\n\nPor favor responde con una LETRA:\n*A* ✅ Confirmar Cita\n*B* ❌ Cancelar Cita\n\n📌 Por favor guarda nuestro número para recibir tus recordatorios.`;
        await this.sendMessage(jid, menuTexto);
        session.userSessions.set(jid, {
            type: 'waiting_agenda_response' as any,
            timestamp: Date.now(),
            citaId,
        });
    }

    async handleAgendaPollResponse(selectedOption: string, citaId: number, remoteJid: string) {
        if (selectedOption.includes('Confirmar')) {
            await this.agendaService.update(citaId, { estado: 'confirmado' } as any);
            await this.sendMessage(remoteJid, "¡Gracias! Tu cita ha sido confirmada satisfactoriamente.");
        } else if (selectedOption.includes('Cancelar')) {
            try {
                await this.agendaService.update(citaId, { estado: 'cancelado' } as any);
                await this.sendMessage(remoteJid, 'Por favor, comuníquese con el Consultorio para agendar su cita en otra fecha y horario');
            } catch (err) {}
        }
    }

    getStatus() {
        const session = this.getSession();
        return {
            status: session.status,
            qr: session.qrCode
        };
    }

    async disconnect() {
        const session = this.getSession();
        if (session.sock) {
            session.intentionalDisconnect = true;
            session.sock.end(undefined);
            session.status = 'disconnected';
            session.qrCode = null;
            session.initializationStartTime = null;

            if (session.initializationTimeout) {
                clearTimeout(session.initializationTimeout);
                session.initializationTimeout = null;
            }
        }
    }

    async resetSession() {
        await this.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const session = this.getSession();
        session.status = 'disconnected';
        session.qrCode = null;

        await this.whatsappSessionRepository.clear();
        console.log(`[Chatbot] Deleted database sessions for CURARE`);
    }

    private async handleConsultarInventario(remoteJid: string, text: string) {
        const keywords = ['cuanto', 'cuantos', 'hay', 'stock', 'existencia', 'inventario', 'de'];
        let itemName = text;

        keywords.forEach(k => {
            const regex = new RegExp(`\\b${k}\\b`, 'gi');
            itemName = itemName.replace(regex, '');
        });

        itemName = itemName.replace(/[?¿!]/g, '').trim();

        if (!itemName) {
            await this.sendMessage(remoteJid, 'Por favor, dime qué producto deseas consultar. Ejemplo: "¿Cuánto algodón hay?"');
            return;
        }

        const result = await this.inventarioService.findAll(itemName, 1, 5);

        if (result.data.length === 0) {
            await this.sendMessage(remoteJid, `Lo siento, no encontré productos que coincidan con "${itemName}" en el inventario.`);
        } else if (result.data.length === 1) {
            const item = result.data[0];
            await this.sendMessage(remoteJid, `*Inventario:* ${item.descripcion}\n` +
                `- Cantidad existente: ${item.cantidad_existente}\n` +
                `- Stock mínimo: ${item.stock_minimo}`);
        } else {
            let reply = `Encontré varios resultados para "${itemName}":\n\n`;
            result.data.forEach(item => {
                reply += `*${item.descripcion}*\n- Existencia: ${item.cantidad_existente} | Mínimo: ${item.stock_minimo}\n\n`;
            });
            reply += `Por favor, intenta ser más específico si no ves el producto que buscas.`;
            await this.sendMessage(remoteJid, reply);
        }
    }
}
