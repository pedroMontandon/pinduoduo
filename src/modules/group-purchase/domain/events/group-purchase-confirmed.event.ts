import { DomainEvent } from '../../../../shared/events/domain-event.base';

export class GroupPurchaseConfirmedEvent extends DomainEvent {
  readonly eventName = 'group_purchase.confirmed';
  readonly participantIds: string[];
  readonly targetPrice: number;
  readonly discountPercentage: number;
  readonly productId: string;

  constructor(props: {
    aggregateId: string;
    participantIds: string[];
    targetPrice: number;
    discountPercentage: number;
    productId: string;
  }) {
    super(props.aggregateId);
    this.participantIds = props.participantIds;
    this.targetPrice = props.targetPrice;
    this.discountPercentage = props.discountPercentage;
    this.productId = props.productId;
  }
}
