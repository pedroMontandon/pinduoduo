export abstract class DomainEvent {
  abstract readonly eventName: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
  }
}
