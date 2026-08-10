import { PartialType } from '@nestjs/mapped-types';
import { CreateDatosCentroDentalDto } from './create-datos-centro-dental.dto';

export class UpdateDatosCentroDentalDto extends PartialType(CreateDatosCentroDentalDto) {}
