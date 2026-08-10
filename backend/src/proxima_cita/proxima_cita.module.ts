import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProximaCitaService } from './proxima_cita.service';
import { ProximaCitaController } from './proxima_cita.controller';
import { ProximaCita } from './entities/proxima_cita.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ProximaCita])],
    controllers: [ProximaCitaController],
    providers: [ProximaCitaService],
    exports: [ProximaCitaService]
})
export class ProximaCitaModule { }
