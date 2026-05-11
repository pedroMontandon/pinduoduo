import { UserEventConsumer } from '../../../src/modules/user/infrastructure/messaging/user-event.consumer';
import { NotifyGroupConfirmedUseCase } from '../../../src/modules/user/application/use-cases/notify-group-confirmed/notify-group-confirmed.use-case';
import { GroupPurchaseConfirmedEvent } from '../../../src/modules/group-purchase/domain/events/group-purchase-confirmed.event';

describe('UserEventConsumer', () => {
  let consumer: UserEventConsumer;
  let mockNotify: jest.Mocked<{ execute: NotifyGroupConfirmedUseCase['execute'] }>;

  beforeEach(() => {
    mockNotify = { execute: jest.fn() };
    consumer = new UserEventConsumer(mockNotify as unknown as NotifyGroupConfirmedUseCase);
  });

  describe('handleGroupPurchaseConfirmed', () => {
    it('notifies all participants with the group id and discount percentage', async () => {
      const event = new GroupPurchaseConfirmedEvent({
        aggregateId: 'group-abc',
        participantIds: ['user-1', 'user-2', 'user-3'],
        targetPrice: 80,
        discountPercentage: 20,
        productId: 'product-1',
      });

      await consumer.handleGroupPurchaseConfirmed(event);

      expect(mockNotify.execute).toHaveBeenCalledTimes(1);
      expect(mockNotify.execute).toHaveBeenCalledWith(
        'group-abc',
        ['user-1', 'user-2', 'user-3'],
        20,
      );
    });

    it('passes the aggregateId as the group purchase id', async () => {
      const event = new GroupPurchaseConfirmedEvent({
        aggregateId: 'specific-group-id',
        participantIds: ['user-x'],
        targetPrice: 50,
        discountPercentage: 10,
        productId: 'product-2',
      });

      await consumer.handleGroupPurchaseConfirmed(event);

      const [groupId] = (mockNotify.execute as jest.Mock).mock.calls[0];
      expect(groupId).toBe('specific-group-id');
    });

    it('passes the full participantIds array without modification', async () => {
      const participants = ['u1', 'u2', 'u3', 'u4', 'u5'];
      const event = new GroupPurchaseConfirmedEvent({
        aggregateId: 'group-large',
        participantIds: participants,
        targetPrice: 30,
        discountPercentage: 30,
        productId: 'product-3',
      });

      await consumer.handleGroupPurchaseConfirmed(event);

      const [, notifiedParticipants] = (mockNotify.execute as jest.Mock).mock.calls[0];
      expect(notifiedParticipants).toEqual(participants);
    });
  });
});
