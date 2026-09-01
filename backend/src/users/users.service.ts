import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya existe');
    }

    if (createUserDto.codigo_proforma && Number(createUserDto.codigo_proforma) > 0) {
      const codeUser = await this.usersRepository.findOne({
        where: { codigo_proforma: Number(createUserDto.codigo_proforma) }
      });
      if (codeUser) {
        throw new ConflictException('El código de aprobación ya se encuentra registrado por otro usuario');
      }
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    queryBuilder.orderBy('user.name', 'ASC');
    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.codigo_proforma && Number(updateUserDto.codigo_proforma) > 0) {
      const codeUser = await this.usersRepository.findOne({
        where: { codigo_proforma: Number(updateUserDto.codigo_proforma) }
      });
      if (codeUser && codeUser.id !== id) {
        throw new ConflictException('El código de aprobación ya se encuentra registrado por otro usuario');
      }
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async findRecepcionistas(): Promise<User[]> {
    return this.usersRepository.find({
      where: { recepcionista: true }
    });
  }

  async changePassword(id: number, currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    // Verificar que las contraseñas nuevas coincidan
    if (newPassword !== confirmPassword) {
      throw new ConflictException('Las contraseñas no coinciden');
    }

    // Obtener el usuario
    const user = await this.findOne(id);

    // Verificar que la contraseña actual sea correcta
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('La contraseña actual es incorrecta');
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña
    user.password = hashedPassword;
    await this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
