import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { LoginUseCase } from './application/use-cases/login/login.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { UserTypeOrmEntity } from './infrastructure/persistence/user.typeorm-entity';
import { UserTypeOrmRepository } from './infrastructure/persistence/user.typeorm-repository';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeOrmEntity]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    LoginUseCase,
    JwtStrategy,
    { provide: USER_REPOSITORY, useClass: UserTypeOrmRepository },
  ],
  exports: [JwtModule, PassportModule],
})
export class UserModule {}
