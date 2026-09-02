import { PartialType } from '@nestjs/mapped-types';
import { CreateEstudioComplementarioDto } from './create-estudio-complementario.dto';

export class UpdateEstudioComplementarioDto extends PartialType(CreateEstudioComplementarioDto) {}
