import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent } from './domain-event.base';

@Injectable()
export class DomainEventPublisher {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  publish(event: DomainEvent): void {
    this.amqpConnection.publish('domain_events', event.eventName, event);
  }

  publishAll(events: DomainEvent[]): void {
    events.forEach(event => this.publish(event));
  }
}
