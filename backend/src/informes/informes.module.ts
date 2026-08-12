import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformesService } from './informes.service';
import { InformesController } from './informes.controller';
import { Informe } from './entities/informe.entity';
import { Doctor } from '../doctors/entities/doctor.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Informe, Doctor])],
    controllers: [InformesController],
    providers: [InformesService],
    exports: [InformesService],
})
export class InformesModule {}
