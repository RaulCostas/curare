import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() signInDto: Record<string, any>) {
        return this.authService.signIn(signInDto.email, signInDto.password);
    }
    @HttpCode(HttpStatus.OK)
    @Post('verify-password')
    verifyPassword(@Body() body: { email?: string; userId?: number; password: string }) {
        const identifier = body.userId || body.email || '';
        return this.authService.verifyPassword(identifier, body.password);
    }

    @Post('forgot-password')
    forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }
}
