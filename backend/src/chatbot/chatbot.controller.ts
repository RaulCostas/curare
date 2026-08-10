import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
    constructor(private readonly chatbotService: ChatbotService) { }

    @Get(['status', ':id/status'])
    getStatus() {
        return this.chatbotService.getStatus();
    }

    @Post(['initialize', ':id/initialize'])
    async initialize() {
        try {
            await this.chatbotService.initialize();
            return this.chatbotService.getStatus();
        } catch (error: any) {
            console.error(`[ChatbotController] [CURARE] Error initializing:`, error);
            return {
                status: 'disconnected',
                error: error.message || 'Failed to initialize chatbot'
            };
        }
    }

    @Post(['disconnect', ':id/disconnect'])
    async disconnect() {
        await this.chatbotService.disconnect();
        return { status: 'disconnected' };
    }

    @Post(['reset', ':id/reset'])
    async reset() {
        await this.chatbotService.resetSession();
        return { status: 'disconnected', message: 'Session reset successfully' };
    }

    @Post('send-birthday/:id')
    async sendBirthday(@Param('id') id: string) {
        return this.chatbotService.sendBirthdayGreeting(+id);
    }

    @Post('send')
    async sendMessage(@Body() body: { jid: string, text: string }) {
        await this.chatbotService.sendMessage(body.jid, body.text);
        return { success: true };
    }

    @Post('send-pdf')
    async sendPdf(@Body() body: { jid: string, base64: string, fileName: string, caption?: string }) {
        await this.chatbotService.sendPdf(body.jid, body.base64, body.fileName, body.caption);
        return { success: true };
    }

    @Post('send-media')
    async sendMedia(@Body() body: { jid: string, filename: string, caption?: string }) {
        await this.chatbotService.sendMedia(body.jid, body.filename, body.caption);
        return { success: true };
    }
}
