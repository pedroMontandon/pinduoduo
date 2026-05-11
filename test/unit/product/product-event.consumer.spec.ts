import { ProductEventConsumer } from '../../../src/modules/product/infrastructure/messaging/product-event.consumer';
import { ReserveProductStockUseCase } from '../../../src/modules/product/application/use-cases/reserve-product-stock/reserve-product-stock.use-case';
import { ReleaseProductStockUseCase } from '../../../src/modules/product/application/use-cases/release-product-stock/release-product-stock.use-case';
import { GroupPurchaseCreatedEvent } from '../../../src/modules/group-purchase/domain/events/group-purchase-created.event';
import { GroupPurchaseExpiredEvent } from '../../../src/modules/group-purchase/domain/events/group-purchase-expired.event';

describe('ProductEventConsumer', () => {
  let consumer: ProductEventConsumer;
  let mockReserve: jest.Mocked<{ execute: ReserveProductStockUseCase['execute'] }>;
  let mockRelease: jest.Mocked<{ execute: ReleaseProductStockUseCase['execute'] }>;

  beforeEach(() => {
    mockReserve = { execute: jest.fn().mockResolvedValue(undefined) };
    mockRelease = { execute: jest.fn().mockResolvedValue(undefined) };
    consumer = new ProductEventConsumer(
      mockReserve as unknown as ReserveProductStockUseCase,
      mockRelease as unknown as ReleaseProductStockUseCase,
    );
  });

  describe('handleGroupPurchaseCreated', () => {
    it('reserves stock using productId and minimumParticipants from the event', async () => {
      const event = new GroupPurchaseCreatedEvent({
        aggregateId: 'group-1',
        productId: 'product-42',
        creatorId: 'user-1',
        minimumParticipants: 5,
        targetPrice: 99.99,
        expiresAt: new Date(),
      });

      await consumer.handleGroupPurchaseCreated(event);

      expect(mockReserve.execute).toHaveBeenCalledTimes(1);
      expect(mockReserve.execute).toHaveBeenCalledWith('product-42', 5);
    });

    it('does not touch the release use case', async () => {
      const event = new GroupPurchaseCreatedEvent({
        aggregateId: 'group-1',
        productId: 'product-42',
        creatorId: 'user-1',
        minimumParticipants: 3,
        targetPrice: 50,
        expiresAt: new Date(),
      });

      await consumer.handleGroupPurchaseCreated(event);

      expect(mockRelease.execute).not.toHaveBeenCalled();
    });

    it('passes the minimumParticipants as the quantity to reserve', async () => {
      const event = new GroupPurchaseCreatedEvent({
        aggregateId: 'group-2',
        productId: 'product-7',
        creatorId: 'user-2',
        minimumParticipants: 20,
        targetPrice: 200,
        expiresAt: new Date(),
      });

      await consumer.handleGroupPurchaseCreated(event);

      expect(mockReserve.execute).toHaveBeenCalledWith('product-7', 20);
    });
  });

  describe('handleGroupPurchaseExpired', () => {
    it('releases stock using productId and minimumRequired from the event', async () => {
      const event = new GroupPurchaseExpiredEvent({
        aggregateId: 'group-3',
        productId: 'product-99',
        participantCount: 2,
        minimumRequired: 10,
      });

      await consumer.handleGroupPurchaseExpired(event);

      expect(mockRelease.execute).toHaveBeenCalledTimes(1);
      expect(mockRelease.execute).toHaveBeenCalledWith('product-99', 10);
    });

    it('does not touch the reserve use case', async () => {
      const event = new GroupPurchaseExpiredEvent({
        aggregateId: 'group-3',
        productId: 'product-99',
        participantCount: 2,
        minimumRequired: 10,
      });

      await consumer.handleGroupPurchaseExpired(event);

      expect(mockReserve.execute).not.toHaveBeenCalled();
    });

    it('passes minimumRequired (not participantCount) as the quantity to release', async () => {
      const event = new GroupPurchaseExpiredEvent({
        aggregateId: 'group-4',
        productId: 'product-11',
        participantCount: 3,
        minimumRequired: 15,
      });

      await consumer.handleGroupPurchaseExpired(event);

      expect(mockRelease.execute).toHaveBeenCalledWith('product-11', 15);
    });
  });
});
