import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelevisionService } from './television.service';
import { TelevisionController } from './television.controller';
import { Television } from './entities/television.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Television])],
    controllers: [TelevisionController],
    providers: [TelevisionService],
    exports: [TelevisionService],
})
export class TelevisionModule { }
