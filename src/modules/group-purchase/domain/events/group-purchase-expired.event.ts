import { DomainEvent } from '../../../../shared/events/domain-event.base';

export class GroupPurchaseExpiredEvent extends DomainEvent {
  readonly eventName = 'group_purchase.expired';
  readonly productId: string;
  readonly participantCount: number;
  readonly minimumRequired: number;

  constructor(props: {
    aggregateId: string;
    productId: string;
    participantCount: number;
    minimumRequired: number;
  }) {
    super(props.aggregateId);
    this.productId = props.productId;
    this.participantCount = props.participantCount;
    this.minimumRequired = props.minimumRequired;
  }
}
