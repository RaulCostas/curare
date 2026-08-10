import { PartialType } from '@nestjs/mapped-types';
import { CreateProximaCitaDto } from './create-proxima_cita.dto';

export class UpdateProximaCitaDto extends PartialType(CreateProximaCitaDto) { }
