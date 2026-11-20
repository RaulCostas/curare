import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacienteDocumento } from './entities/paciente_documento.entity';
import { PacienteDocumentosController } from './paciente_documentos.controller';
import { PacienteDocumentosService } from './paciente_documentos.service';

@Module({
    imports: [TypeOrmModule.forFeature([PacienteDocumento])],
    controllers: [PacienteDocumentosController],
    providers: [PacienteDocumentosService],
    exports: [PacienteDocumentosService],
})
export class PacienteDocumentosModule {}
