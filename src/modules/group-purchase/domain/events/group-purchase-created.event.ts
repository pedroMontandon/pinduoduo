import { DomainEvent } from '../../../../shared/events/domain-event.base';

export class GroupPurchaseCreatedEvent extends DomainEvent {
  readonly eventName = 'group_purchase.created';
  readonly productId: string;
  readonly creatorId: string;
  readonly targetPrice: number;
  readonly minimumParticipants: number;
  readonly expiresAt: Date;

  constructor(props: {
    aggregateId: string;
    productId: string;
    creatorId: string;
    targetPrice: number;
    minimumParticipants: number;
    expiresAt: Date;
  }) {
    super(props.aggregateId);
    this.productId = props.productId;
    this.creatorId = props.creatorId;
    this.targetPrice = props.targetPrice;
    this.minimumParticipants = props.minimumParticipants;
    this.expiresAt = props.expiresAt;
  }
}
