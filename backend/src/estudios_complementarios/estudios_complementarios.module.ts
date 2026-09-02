import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstudioComplementario } from './entities/estudio_complementario.entity';
import { EstudiosComplementariosService } from './estudios_complementarios.service';
import { EstudiosComplementariosController } from './estudios_complementarios.controller';

@Module({
    imports: [TypeOrmModule.forFeature([EstudioComplementario])],
    controllers: [EstudiosComplementariosController],
    providers: [EstudiosComplementariosService],
    exports: [EstudiosComplementariosService],
})
export class EstudiosComplementariosModule {}
