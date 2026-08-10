import { PartialType } from '@nestjs/mapped-types';
import { CreateCasoClinicoDto } from './create-caso-clinico.dto';

export class UpdateCasoClinicoDto extends PartialType(CreateCasoClinicoDto) {}
