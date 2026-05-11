import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from './domain-event.base';

@Injectable()
export class DomainEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.eventEmitter.emit(event.eventName, event);
  }

  publishAll(events: DomainEvent[]): void {
    events.forEach(event => this.publish(event));
  }
}
