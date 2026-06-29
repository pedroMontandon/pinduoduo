import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepository,
} from '../../../domain/repositories/notification.repository';
import { ListNotificationsDto } from './list-notifications.dto';

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string, dto: ListNotificationsDto) {
    const skip = dto.skip ?? 0;
    const take = dto.take ?? 10;

    const result = await this.notificationRepository.findByUserId(userId, {
      skip,
      take,
    });

    return {
      items: result.items.map(notification => ({
        id: notification.id,
        message: notification.message,
        groupPurchaseId: notification.groupPurchaseId,
        read: notification.read,
        createdAt: notification.createdAt,
      })),
      total: result.total,
      skip,
      take,
    };
  }
}
