import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasosClinicosService } from './casos_clinicos.service';
import { CasosClinicosController } from './casos_clinicos.controller';
import { CasoClinico } from './entities/caso_clinico.entity';
import { CasoClinicoFoto } from './entities/caso_clinico_foto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CasoClinico, CasoClinicoFoto])],
    controllers: [CasosClinicosController],
    providers: [CasosClinicosService],
    exports: [CasosClinicosService],
})
export class CasosClinicosModule {}
