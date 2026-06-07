import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { DomainEvent } from './domain-event.base';

@Injectable()
export class DomainEventPublisher {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @InjectMetric('domain_events_published_total')
    private readonly eventsCounter: Counter<string>,
  ) {}

  publish(event: DomainEvent): void {
    this.amqpConnection.publish('domain_events', event.eventName, event);
    this.eventsCounter.inc({ event_name: event.eventName });
  }

  publishAll(events: DomainEvent[]): void {
    events.forEach(event => this.publish(event));
  }
}
