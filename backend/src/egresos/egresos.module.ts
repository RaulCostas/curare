import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EgresosService } from './egresos.service';
import { EgresosController } from './egresos.controller';
import { Egreso } from './entities/egreso.entity';
import { Recibo } from '../recibo/entities/recibo.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Egreso, Recibo])],
    controllers: [EgresosController],
    providers: [EgresosService],
})
export class EgresosModule { }
