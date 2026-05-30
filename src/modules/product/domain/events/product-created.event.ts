import { DomainEvent } from '../../../../shared/events/domain-event.base';

export class ProductCreatedEvent extends DomainEvent {
  readonly eventName = 'product.created';
  readonly name: string;
  readonly price: number;
  readonly stock: number;

  constructor(props: { aggregateId: string; name: string; price: number; stock: number }) {
    super(props.aggregateId);
    this.name = props.name;
    this.price = props.price;
    this.stock = props.stock;
  }
}
