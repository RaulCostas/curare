import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async signIn(email: string, pass: string): Promise<{ access_token: string, user: any }> {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new UnauthorizedException();
        }

        if (user.estado && user.estado.toLowerCase() !== 'activo') {
            throw new UnauthorizedException('Su cuenta está inactiva. Por favor contacte al administrador.');
        }

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            throw new UnauthorizedException();
        }
        const payload = { sub: user.id, username: user.email };
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                permisos: user.permisos,
                recepcionista: user.recepcionista,
                foto: user.foto
            },
        };
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            // For security, don't reveal if user exists
            return { message: 'Si el correo existe, se enviará una nueva contraseña.' };
        }

        // Generate random password (8 chars)
        const tempPassword = Math.random().toString(36).slice(-8);

        // Hash password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Update user
        await this.usersService.update(user.id, { password: hashedPassword, foto: user.foto, estado: user.estado });

        // MOCK EMAIL: Log to console
        console.log('==================================================');
        console.log(`[MOCK EMAIL SERVICE] Password Recovery for ${email}`);
        console.log(`Temporary Password: ${tempPassword}`);
        console.log('==================================================');

        return { message: 'Si el correo existe, se enviará una nueva contraseña.' };
    }
}
