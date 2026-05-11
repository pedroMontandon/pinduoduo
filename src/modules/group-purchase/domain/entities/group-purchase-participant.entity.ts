import { randomUUID } from 'crypto';

export enum ParticipantStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

export class GroupPurchaseParticipant {
  readonly id: string;
  readonly userId: string;
  readonly joinedAt: Date;
  status: ParticipantStatus;

  private constructor(props: {
    id: string;
    userId: string;
    status: ParticipantStatus;
    joinedAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.status = props.status;
    this.joinedAt = props.joinedAt;
  }

  static create(userId: string): GroupPurchaseParticipant {
    return new GroupPurchaseParticipant({
      id: randomUUID(),
      userId,
      status: ParticipantStatus.ACTIVE,
      joinedAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    status: ParticipantStatus;
    joinedAt: Date;
  }): GroupPurchaseParticipant {
    return new GroupPurchaseParticipant(props);
  }

  cancel(): void {
    this.status = ParticipantStatus.CANCELLED;
  }

  isActive(): boolean {
    return this.status === ParticipantStatus.ACTIVE;
  }
}
