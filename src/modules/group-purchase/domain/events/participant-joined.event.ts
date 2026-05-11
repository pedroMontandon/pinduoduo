import { DomainEvent } from '../../../../shared/events/domain-event.base';

export class ParticipantJoinedEvent extends DomainEvent {
  readonly eventName = 'group_purchase.participant_joined';
  readonly userId: string;
  readonly currentParticipantCount: number;

  constructor(props: {
    aggregateId: string;
    userId: string;
    currentParticipantCount: number;
  }) {
    super(props.aggregateId);
    this.userId = props.userId;
    this.currentParticipantCount = props.currentParticipantCount;
  }
}
