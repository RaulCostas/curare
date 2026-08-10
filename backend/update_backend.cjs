const fs = require('fs');

// 1. Update controller
let c = fs.readFileSync('src/pacientes/pacientes.controller.ts', 'utf-8');
if (!c.includes('FileInterceptor')) {
    c = "import { UseInterceptors, UploadedFile, Res } from '@nestjs/common';\n" +
        "import { FileInterceptor } from '@nestjs/platform-express';\n" +
        "import { diskStorage } from 'multer';\n" +
        "import { extname } from 'path';\n" + c;
        
    c = c.replace(/}\s*$/, `
    // Endpoints para Foto
    @Post(':id/foto')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/pacientes',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, \`\${randomName}\${extname(file.originalname)}\`);
            }
        })
    }))
    async uploadFoto(@Param('id') id: string, @UploadedFile() file: any) {
        return this.pacientesService.uploadFoto(+id, file.filename);
    }

    @Get('foto/file/:filename')
    serveFoto(@Param('filename') filename: string, @Res() res: any) {
        return res.sendFile(filename, { root: './uploads/pacientes' });
    }
}
`);
    fs.writeFileSync('src/pacientes/pacientes.controller.ts', c);
}

// 2. Update service
let s = fs.readFileSync('src/pacientes/pacientes.service.ts', 'utf-8');
if (!s.includes('uploadFoto')) {
    s = s.replace(/}\s*$/, `
    async uploadFoto(id: number, filename: string) {
        const paciente = await this.pacienteRepository.findOne({ where: { id } });
        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }
        paciente.foto = filename;
        return this.pacienteRepository.save(paciente);
    }
}
`);
    fs.writeFileSync('src/pacientes/pacientes.service.ts', s);
}
