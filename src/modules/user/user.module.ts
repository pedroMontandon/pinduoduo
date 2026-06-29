import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { LoginUseCase } from './application/use-cases/login/login.use-case';
import { NotifyGroupConfirmedUseCase } from './application/use-cases/notify-group-confirmed/notify-group-confirmed.use-case';
import { ListNotificationsUseCase } from './application/use-cases/list-notifications/list-notifications.use-case';
import { GetUnreadCountUseCase } from './application/use-cases/get-unread-count/get-unread-count.use-case';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read/mark-notification-read.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository';
import { UserTypeOrmEntity } from './infrastructure/persistence/user.typeorm-entity';
import { UserTypeOrmRepository } from './infrastructure/persistence/user.typeorm-repository';
import { NotificationTypeOrmEntity } from './infrastructure/persistence/notification.typeorm-entity';
import { NotificationTypeOrmRepository } from './infrastructure/persistence/notification.typeorm-repository';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { UserEventConsumer } from './infrastructure/messaging/user-event.consumer';
import { UserController } from './presentation/controllers/user.controller';
import { NotificationController } from './presentation/controllers/notification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeOrmEntity, NotificationTypeOrmEntity]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [UserController, NotificationController],
  providers: [
    CreateUserUseCase,
    LoginUseCase,
    NotifyGroupConfirmedUseCase,
    ListNotificationsUseCase,
    GetUnreadCountUseCase,
    MarkNotificationReadUseCase,
    JwtStrategy,
    UserEventConsumer,
    { provide: USER_REPOSITORY, useClass: UserTypeOrmRepository },
    { provide: NOTIFICATION_REPOSITORY, useClass: NotificationTypeOrmRepository },
  ],
  exports: [JwtModule, PassportModule, USER_REPOSITORY],
})
export class UserModule {}
