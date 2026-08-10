import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaPacienteService } from './categoria_paciente.service';
import { CategoriaPacienteController } from './categoria_paciente.controller';
import { CategoriaPaciente } from './entities/categoria_paciente.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CategoriaPaciente])],
    controllers: [CategoriaPacienteController],
    providers: [CategoriaPacienteService],
    exports: [CategoriaPacienteService]
})
export class CategoriaPacienteModule { }
