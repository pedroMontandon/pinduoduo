import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DomainEventPublisher } from './domain-event-publisher.service';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
      exchanges: [
        {
          name: 'domain_events',
          type: 'topic',
          options: { durable: true },
        },
      ],
      connectionInitOptions: { wait: false },
    }),
  ],
  providers: [DomainEventPublisher],
  exports: [DomainEventPublisher, RabbitMQModule],
})
export class SharedEventsModule {}
