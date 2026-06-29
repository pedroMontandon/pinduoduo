import { Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../../domain/entities/notification.entity';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepository,
} from '../../../domain/repositories/notification.repository';

@Injectable()
export class NotifyGroupConfirmedUseCase {
  private readonly logger = new Logger(NotifyGroupConfirmedUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    groupPurchaseId: string,
    participantIds: string[],
    discountPercentage: number,
  ): Promise<void> {
    this.logger.log(
      `Group purchase ${groupPurchaseId} confirmed with ${discountPercentage}% discount. ` +
        `Notifying ${participantIds.length} participant(s): [${participantIds.join(', ')}]`,
    );

    const message = `Sua compra em grupo foi confirmada com ${discountPercentage}% de desconto!`;
    const notifications = participantIds.map(userId =>
      Notification.create({ userId, message, groupPurchaseId }),
    );

    await this.notificationRepository.saveAll(notifications);
  }
}
