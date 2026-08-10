import { PartialType } from '@nestjs/mapped-types';
import { CreateMusicaDto } from './create-musica.dto';

export class UpdateMusicaDto extends PartialType(CreateMusicaDto) { }
