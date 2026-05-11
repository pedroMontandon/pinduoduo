import { Global, Module } from '@nestjs/common';
import { DomainEventPublisher } from './domain-event-publisher.service';

@Global()
@Module({
  providers: [DomainEventPublisher],
  exports: [DomainEventPublisher],
})
export class SharedEventsModule {}
