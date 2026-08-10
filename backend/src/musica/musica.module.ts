import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MusicaService } from './musica.service';
import { MusicaController } from './musica.controller';
import { Musica } from './entities/musica.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Musica])],
    controllers: [MusicaController],
    providers: [MusicaService],
    exports: [MusicaService],
})
export class MusicaModule { }
