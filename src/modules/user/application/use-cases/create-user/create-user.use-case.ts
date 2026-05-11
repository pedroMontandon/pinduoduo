import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../../domain/entities/user.entity';
import { USER_REPOSITORY, UserRepository } from '../../../domain/repositories/user.repository';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<{ id: string }> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = User.create({ name: dto.name, email: dto.email, passwordHash });

    await this.userRepository.save(user);

    return { id: user.id };
  }
}
