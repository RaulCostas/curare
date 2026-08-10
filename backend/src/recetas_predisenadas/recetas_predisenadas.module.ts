import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecetasPredisenadasService } from './recetas_predisenadas.service';
import { RecetasPredisenadasController } from './recetas_predisenadas.controller';
import { RecetaPredisenada } from './entities/receta_predisenada.entity';
import { RecetaPredisenadaDetalle } from './entities/receta_predisenada_detalle.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RecetaPredisenada, RecetaPredisenadaDetalle])],
    controllers: [RecetasPredisenadasController],
    providers: [RecetasPredisenadasService],
    exports: [RecetasPredisenadasService],
})
export class RecetasPredisenadasModule {}
