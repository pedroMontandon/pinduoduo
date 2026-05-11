import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { GroupPurchaseCreatedEvent } from '../../../group-purchase/domain/events/group-purchase-created.event';
import { GroupPurchaseExpiredEvent } from '../../../group-purchase/domain/events/group-purchase-expired.event';
import { ReserveProductStockUseCase } from '../../application/use-cases/reserve-product-stock/reserve-product-stock.use-case';
import { ReleaseProductStockUseCase } from '../../application/use-cases/release-product-stock/release-product-stock.use-case';

@Injectable()
export class ProductEventConsumer {
  private readonly logger = new Logger(ProductEventConsumer.name);

  constructor(
    private readonly reserveProductStock: ReserveProductStockUseCase,
    private readonly releaseProductStock: ReleaseProductStockUseCase,
  ) {}

  @RabbitSubscribe({
    exchange: 'domain_events',
    routingKey: 'group_purchase.created',
    queue: 'product.stock.reserve',
    queueOptions: { durable: true },
  })
  async handleGroupPurchaseCreated(event: GroupPurchaseCreatedEvent): Promise<void> {
    this.logger.log(`Reserving stock for group purchase ${event.aggregateId}`);
    await this.reserveProductStock.execute(event.productId, event.minimumParticipants);
  }

  @RabbitSubscribe({
    exchange: 'domain_events',
    routingKey: 'group_purchase.expired',
    queue: 'product.stock.release',
    queueOptions: { durable: true },
  })
  async handleGroupPurchaseExpired(event: GroupPurchaseExpiredEvent): Promise<void> {
    this.logger.log(`Releasing stock for expired group purchase ${event.aggregateId}`);
    await this.releaseProductStock.execute(event.productId, event.minimumRequired);
  }
}
