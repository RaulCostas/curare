import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaPacienteDto } from './create-categoria_paciente.dto';

export class UpdateCategoriaPacienteDto extends PartialType(CreateCategoriaPacienteDto) { }
