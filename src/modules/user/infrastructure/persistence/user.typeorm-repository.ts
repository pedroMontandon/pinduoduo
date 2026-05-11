import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserTypeOrmEntity } from './user.typeorm-entity';

@Injectable()
export class UserTypeOrmRepository implements UserRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly repo: Repository<UserTypeOrmEntity>,
  ) {}

  async save(user: User): Promise<void> {
    const record = this.repo.create({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      createdAt: user.createdAt,
    });
    await this.repo.save(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.repo.findOne({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.repo.findOne({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: UserTypeOrmEntity): User {
    return User.reconstitute({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      name: record.name,
      createdAt: record.createdAt,
    });
  }
}
