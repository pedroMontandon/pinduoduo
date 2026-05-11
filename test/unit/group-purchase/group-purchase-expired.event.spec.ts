import { GroupPurchaseExpiredEvent } from '../../../src/modules/group-purchase/domain/events/group-purchase-expired.event';

describe('GroupPurchaseExpiredEvent', () => {
  const props = {
    aggregateId: 'group-expired-1',
    productId: 'product-xyz',
    participantCount: 3,
    minimumRequired: 10,
  };

  it('sets eventName to group_purchase.expired', () => {
    const event = new GroupPurchaseExpiredEvent(props);
    expect(event.eventName).toBe('group_purchase.expired');
  });

  it('carries the aggregateId from the group purchase', () => {
    const event = new GroupPurchaseExpiredEvent(props);
    expect(event.aggregateId).toBe('group-expired-1');
  });

  it('carries the productId so the product module can release stock', () => {
    const event = new GroupPurchaseExpiredEvent(props);
    expect(event.productId).toBe('product-xyz');
  });

  it('carries participantCount and minimumRequired', () => {
    const event = new GroupPurchaseExpiredEvent(props);
    expect(event.participantCount).toBe(3);
    expect(event.minimumRequired).toBe(10);
  });

  it('sets occurredOn to the current time', () => {
    const before = new Date();
    const event = new GroupPurchaseExpiredEvent(props);
    const after = new Date();

    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
