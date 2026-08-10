import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialUtilizadoDto } from './create-material-utilizado.dto';

export class UpdateMaterialUtilizadoDto extends PartialType(CreateMaterialUtilizadoDto) { }
