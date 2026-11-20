import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoGeneral } from './entities/documento_general.entity';
import { DocumentosGeneralesController } from './documentos_generales.controller';
import { DocumentosGeneralesService } from './documentos_generales.service';

@Module({
    imports: [TypeOrmModule.forFeature([DocumentoGeneral])],
    controllers: [DocumentosGeneralesController],
    providers: [DocumentosGeneralesService],
    exports: [DocumentosGeneralesService],
})
export class DocumentosGeneralesModule {}
