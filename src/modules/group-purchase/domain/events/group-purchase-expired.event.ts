import { DomainEvent } from '../../../../shared/events/domain-event.base';

export class GroupPurchaseExpiredEvent extends DomainEvent {
  readonly eventName = 'group_purchase.expired';
  readonly participantCount: number;
  readonly minimumRequired: number;

  constructor(props: {
    aggregateId: string;
    participantCount: number;
    minimumRequired: number;
  }) {
    super(props.aggregateId);
    this.participantCount = props.participantCount;
    this.minimumRequired = props.minimumRequired;
  }
}
