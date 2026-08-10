import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecuenciaTratamiento } from './entities/secuencia_tratamiento.entity';
import { SecuenciaTratamientoService } from './secuencia_tratamiento.service';
import { SecuenciaTratamientoController } from './secuencia_tratamiento.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SecuenciaTratamiento])],
    controllers: [SecuenciaTratamientoController],
    providers: [SecuenciaTratamientoService],
    exports: [SecuenciaTratamientoService]
})
export class SecuenciaTratamientoModule { }
