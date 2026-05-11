import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { GroupPurchaseConfirmedEvent } from '../../../group-purchase/domain/events/group-purchase-confirmed.event';
import { NotifyGroupConfirmedUseCase } from '../../application/use-cases/notify-group-confirmed/notify-group-confirmed.use-case';

@Injectable()
export class UserEventConsumer {
  private readonly logger = new Logger(UserEventConsumer.name);

  constructor(private readonly notifyGroupConfirmed: NotifyGroupConfirmedUseCase) {}

  @RabbitSubscribe({
    exchange: 'domain_events',
    routingKey: 'group_purchase.confirmed',
    queue: 'user.notifications',
    queueOptions: { durable: true },
  })
  async handleGroupPurchaseConfirmed(event: GroupPurchaseConfirmedEvent): Promise<void> {
    this.logger.log(`Group purchase confirmed event received for ${event.aggregateId}`);
    this.notifyGroupConfirmed.execute(
      event.aggregateId,
      event.participantIds,
      event.discountPercentage,
    );
  }
}
