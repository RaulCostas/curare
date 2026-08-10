import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recibo } from './entities/recibo.entity';
import { ReciboService } from './recibo.service';
import { ReciboController } from './recibo.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Recibo])],
    controllers: [ReciboController],
    providers: [ReciboService],
    exports: [ReciboService],
})
export class ReciboModule {}
