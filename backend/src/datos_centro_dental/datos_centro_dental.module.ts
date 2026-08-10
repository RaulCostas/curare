import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatosCentroDentalService } from './datos_centro_dental.service';
import { DatosCentroDentalController } from './datos_centro_dental.controller';
import { DatosCentroDental } from './entities/datos_centro_dental.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DatosCentroDental])],
  controllers: [DatosCentroDentalController],
  providers: [DatosCentroDentalService],
  exports: [DatosCentroDentalService],
})
export class DatosCentroDentalModule {}
