import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepository,
} from '../../../domain/repositories/notification.repository';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    await this.notificationRepository.markAsRead(id, userId);
  }

  async markAll(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
