/**
 * Integration tests for cross-module event-driven communication.
 *
 * Requires RabbitMQ to be running:
 *   docker-compose up -d rabbitmq
 *
 * These tests spin up a NestJS application with all three event consumers
 * and the DomainEventPublisher, then verify that publishing a domain event
 * results in the correct consumer and use case being invoked.
 */

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RabbitMQModule, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { DomainEventPublisher } from '../../src/shared/events/domain-event-publisher.service';
import { ProductEventConsumer } from '../../src/modules/product/infrastructure/messaging/product-event.consumer';
import { UserEventConsumer } from '../../src/modules/user/infrastructure/messaging/user-event.consumer';
import { ReserveProductStockUseCase } from '../../src/modules/product/application/use-cases/reserve-product-stock/reserve-product-stock.use-case';
import { ReleaseProductStockUseCase } from '../../src/modules/product/application/use-cases/release-product-stock/release-product-stock.use-case';
import { NotifyGroupConfirmedUseCase } from '../../src/modules/user/application/use-cases/notify-group-confirmed/notify-group-confirmed.use-case';
import { GroupPurchaseCreatedEvent } from '../../src/modules/group-purchase/domain/events/group-purchase-created.event';
import { GroupPurchaseExpiredEvent } from '../../src/modules/group-purchase/domain/events/group-purchase-expired.event';
import { GroupPurchaseConfirmedEvent } from '../../src/modules/group-purchase/domain/events/group-purchase-confirmed.event';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

const waitFor = async (condition: () => boolean, timeoutMs = 5000): Promise<void> => {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitFor timed out — consumer did not process the message in time');
    }
    await new Promise((r) => setTimeout(r, 100));
  }
};

describe('Cross-module messaging integration', () => {
  let app: INestApplication;
  let publisher: DomainEventPublisher;
  let mockReserve: jest.Mocked<{ execute: ReserveProductStockUseCase['execute'] }>;
  let mockRelease: jest.Mocked<{ execute: ReleaseProductStockUseCase['execute'] }>;
  let mockNotify: jest.Mocked<{ execute: NotifyGroupConfirmedUseCase['execute'] }>;

  beforeAll(async () => {
    mockReserve = { execute: jest.fn().mockResolvedValue(undefined) };
    mockRelease = { execute: jest.fn().mockResolvedValue(undefined) };
    mockNotify = { execute: jest.fn() };

    const module = await Test.createTestingModule({
      imports: [
        RabbitMQModule.forRoot(RabbitMQModule, {
          uri: RABBITMQ_URL,
          exchanges: [
            { name: 'domain_events', type: 'topic', options: { durable: true } },
          ],
          connectionInitOptions: { wait: true },
        }),
      ],
      providers: [
        DomainEventPublisher,
        ProductEventConsumer,
        UserEventConsumer,
        { provide: ReserveProductStockUseCase, useValue: mockReserve },
        { provide: ReleaseProductStockUseCase, useValue: mockRelease },
        { provide: NotifyGroupConfirmedUseCase, useValue: mockNotify },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    publisher = module.get(DomainEventPublisher);

    // Allow any residual messages from previous runs to be drained
    await new Promise((r) => setTimeout(r, 500));
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('group_purchase.created event', () => {
    it('triggers stock reservation in the product module', async () => {
      const event = new GroupPurchaseCreatedEvent({
        aggregateId: 'group-integration-1',
        productId: 'product-integration-1',
        creatorId: 'user-integration-1',
        minimumParticipants: 5,
        targetPrice: 199.99,
        expiresAt: new Date(Date.now() + 86400000),
      });

      publisher.publish(event);

      await waitFor(() => (mockReserve.execute as jest.Mock).mock.calls.length > 0);

      expect(mockReserve.execute).toHaveBeenCalledTimes(1);
      expect(mockReserve.execute).toHaveBeenCalledWith('product-integration-1', 5);
      expect(mockRelease.execute).not.toHaveBeenCalled();
      expect(mockNotify.execute).not.toHaveBeenCalled();
    });
  });

  describe('group_purchase.expired event', () => {
    it('triggers stock release in the product module', async () => {
      const event = new GroupPurchaseExpiredEvent({
        aggregateId: 'group-integration-2',
        productId: 'product-integration-2',
        participantCount: 2,
        minimumRequired: 10,
      });

      publisher.publish(event);

      await waitFor(() => (mockRelease.execute as jest.Mock).mock.calls.length > 0);

      expect(mockRelease.execute).toHaveBeenCalledTimes(1);
      expect(mockRelease.execute).toHaveBeenCalledWith('product-integration-2', 10);
      expect(mockReserve.execute).not.toHaveBeenCalled();
      expect(mockNotify.execute).not.toHaveBeenCalled();
    });
  });

  describe('group_purchase.confirmed event', () => {
    it('triggers participant notification in the user module', async () => {
      const event = new GroupPurchaseConfirmedEvent({
        aggregateId: 'group-integration-3',
        participantIds: ['user-a', 'user-b', 'user-c'],
        targetPrice: 80,
        discountPercentage: 20,
        productId: 'product-integration-3',
      });

      publisher.publish(event);

      await waitFor(() => (mockNotify.execute as jest.Mock).mock.calls.length > 0);

      expect(mockNotify.execute).toHaveBeenCalledTimes(1);
      expect(mockNotify.execute).toHaveBeenCalledWith(
        'group-integration-3',
        ['user-a', 'user-b', 'user-c'],
        20,
      );
      expect(mockReserve.execute).not.toHaveBeenCalled();
      expect(mockRelease.execute).not.toHaveBeenCalled();
    });
  });
});
