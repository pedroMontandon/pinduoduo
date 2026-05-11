import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { DomainEventPublisher } from '../../../src/shared/events/domain-event-publisher.service';
import { DomainEvent } from '../../../src/shared/events/domain-event.base';

class TestEvent extends DomainEvent {
  readonly eventName = 'test.event';
  constructor(aggregateId: string) {
    super(aggregateId);
  }
}

class AnotherTestEvent extends DomainEvent {
  readonly eventName = 'another.event';
  constructor(aggregateId: string) {
    super(aggregateId);
  }
}

describe('DomainEventPublisher', () => {
  let publisher: DomainEventPublisher;
  let mockAmqp: jest.Mocked<Pick<AmqpConnection, 'publish'>>;

  beforeEach(() => {
    mockAmqp = { publish: jest.fn().mockResolvedValue(undefined) };
    publisher = new DomainEventPublisher(mockAmqp as unknown as AmqpConnection);
  });

  describe('publish', () => {
    it('sends event to the domain_events exchange using the event name as routing key', () => {
      const event = new TestEvent('aggregate-1');

      publisher.publish(event);

      expect(mockAmqp.publish).toHaveBeenCalledTimes(1);
      expect(mockAmqp.publish).toHaveBeenCalledWith('domain_events', 'test.event', event);
    });

    it('uses the event routing key from the concrete event class', () => {
      const event = new AnotherTestEvent('aggregate-2');

      publisher.publish(event);

      expect(mockAmqp.publish).toHaveBeenCalledWith('domain_events', 'another.event', event);
    });

    it('passes the full event object as payload', () => {
      const event = new TestEvent('aggregate-3');

      publisher.publish(event);

      const [, , payload] = (mockAmqp.publish as jest.Mock).mock.calls[0];
      expect(payload).toBe(event);
      expect(payload.aggregateId).toBe('aggregate-3');
      expect(payload.occurredOn).toBeInstanceOf(Date);
    });
  });

  describe('publishAll', () => {
    it('publishes each event in the array', () => {
      const events = [new TestEvent('agg-1'), new AnotherTestEvent('agg-2'), new TestEvent('agg-3')];

      publisher.publishAll(events);

      expect(mockAmqp.publish).toHaveBeenCalledTimes(3);
      expect(mockAmqp.publish).toHaveBeenNthCalledWith(1, 'domain_events', 'test.event', events[0]);
      expect(mockAmqp.publish).toHaveBeenNthCalledWith(2, 'domain_events', 'another.event', events[1]);
      expect(mockAmqp.publish).toHaveBeenNthCalledWith(3, 'domain_events', 'test.event', events[2]);
    });

    it('does not call publish when given an empty array', () => {
      publisher.publishAll([]);

      expect(mockAmqp.publish).not.toHaveBeenCalled();
    });

    it('publishes a single-element array correctly', () => {
      const event = new TestEvent('agg-solo');

      publisher.publishAll([event]);

      expect(mockAmqp.publish).toHaveBeenCalledTimes(1);
      expect(mockAmqp.publish).toHaveBeenCalledWith('domain_events', 'test.event', event);
    });
  });
});
