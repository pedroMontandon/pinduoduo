import { randomUUID } from 'crypto';
import { DomainEvent } from '../../../../shared/events/domain-event.base';
import { GroupPurchaseParticipant, ParticipantStatus } from '../entities/group-purchase-participant.entity';
import { Price } from '../value-objects/price.vo';
import { GroupPurchaseCreatedEvent } from '../events/group-purchase-created.event';
import { ParticipantJoinedEvent } from '../events/participant-joined.event';
import { ParticipantLeftEvent } from '../events/participant-left.event';
import { GroupPurchaseConfirmedEvent } from '../events/group-purchase-confirmed.event';
import { GroupPurchaseExpiredEvent } from '../events/group-purchase-expired.event';

export enum GroupPurchaseStatus {
  ACTIVE = 'ACTIVE',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
}

export class GroupPurchase {
  readonly id: string;
  readonly productId: string;
  readonly creatorId: string;
  readonly title: string;
  readonly description: string;
  readonly originalPrice: Price;
  readonly targetPrice: Price;
  readonly minimumParticipants: number;
  readonly createdAt: Date;
  readonly expiresAt: Date;

  private _participants: GroupPurchaseParticipant[];
  private _status: GroupPurchaseStatus;
  private _confirmedAt: Date | null;
  private _updatedAt: Date;
  private _domainEvents: DomainEvent[] = [];

  get participants(): GroupPurchaseParticipant[] {
    return [...this._participants];
  }

  get status(): GroupPurchaseStatus {
    return this._status;
  }

  get confirmedAt(): Date | null {
    return this._confirmedAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  private constructor(props: {
    id: string;
    productId: string;
    creatorId: string;
    title: string;
    description: string;
    originalPrice: Price;
    targetPrice: Price;
    minimumParticipants: number;
    participants: GroupPurchaseParticipant[];
    status: GroupPurchaseStatus;
    expiresAt: Date;
    confirmedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.productId = props.productId;
    this.creatorId = props.creatorId;
    this.title = props.title;
    this.description = props.description;
    this.originalPrice = props.originalPrice;
    this.targetPrice = props.targetPrice;
    this.minimumParticipants = props.minimumParticipants;
    this._participants = props.participants;
    this._status = props.status;
    this.expiresAt = props.expiresAt;
    this._confirmedAt = props.confirmedAt;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: {
    productId: string;
    creatorId: string;
    title: string;
    description: string;
    originalPrice: Price;
    targetPrice: Price;
    minimumParticipants: number;
    durationMinutes: number;
  }): GroupPurchase {
    if (!props.targetPrice.isLessThan(props.originalPrice)) {
      throw new Error('Target price must be less than original price');
    }
    if (props.minimumParticipants < 2) {
      throw new Error('Minimum participants must be at least 2');
    }
    if (props.durationMinutes < 1) {
      throw new Error('Duration must be at least 1 minute');
    }

    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + props.durationMinutes * 60 * 1000);
    const creator = GroupPurchaseParticipant.create(props.creatorId);

    const group = new GroupPurchase({
      id,
      productId: props.productId,
      creatorId: props.creatorId,
      title: props.title,
      description: props.description,
      originalPrice: props.originalPrice,
      targetPrice: props.targetPrice,
      minimumParticipants: props.minimumParticipants,
      participants: [creator],
      status: GroupPurchaseStatus.ACTIVE,
      expiresAt,
      confirmedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    group._domainEvents.push(
      new GroupPurchaseCreatedEvent({
        aggregateId: id,
        productId: props.productId,
        creatorId: props.creatorId,
        targetPrice: props.targetPrice.amount,
        minimumParticipants: props.minimumParticipants,
        expiresAt,
      }),
    );

    return group;
  }

  static reconstitute(props: {
    id: string;
    productId: string;
    creatorId: string;
    title: string;
    description: string;
    originalPrice: Price;
    targetPrice: Price;
    minimumParticipants: number;
    participants: GroupPurchaseParticipant[];
    status: GroupPurchaseStatus;
    expiresAt: Date;
    confirmedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): GroupPurchase {
    return new GroupPurchase(props);
  }

  addParticipant(userId: string): void {
    if (!this.canAcceptParticipants()) {
      throw new Error('Group purchase is not accepting participants');
    }
    if (this.hasParticipant(userId)) {
      throw new Error('User already joined this group purchase');
    }

    const participant = GroupPurchaseParticipant.create(userId);
    this._participants.push(participant);
    this._updatedAt = new Date();

    this._domainEvents.push(
      new ParticipantJoinedEvent({
        aggregateId: this.id,
        userId,
        currentParticipantCount: this.getActiveParticipantCount(),
      }),
    );

    if (this.getActiveParticipantCount() >= this.minimumParticipants) {
      this._confirm();
    }
  }

  removeParticipant(userId: string): void {
    if (this.isConfirmed()) {
      throw new Error('Cannot leave a confirmed group purchase');
    }
    if (!this.isActive()) {
      throw new Error('Group purchase is no longer active');
    }
    if (userId === this.creatorId) {
      throw new Error('Creator cannot leave the group purchase');
    }

    const participant = this._participants.find(p => p.userId === userId && p.isActive());
    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.cancel();
    this._updatedAt = new Date();

    this._domainEvents.push(
      new ParticipantLeftEvent({
        aggregateId: this.id,
        userId,
        currentParticipantCount: this.getActiveParticipantCount(),
      }),
    );
  }

  expire(): void {
    if (!this.isActive()) return;
    if (new Date() < this.expiresAt) return;

    this._status = GroupPurchaseStatus.EXPIRED;
    this._updatedAt = new Date();

    this._domainEvents.push(
      new GroupPurchaseExpiredEvent({
        aggregateId: this.id,
        participantCount: this.getActiveParticipantCount(),
        minimumRequired: this.minimumParticipants,
      }),
    );
  }

  private _confirm(): void {
    this._status = GroupPurchaseStatus.CONFIRMED;
    this._confirmedAt = new Date();
    this._updatedAt = new Date();

    this._domainEvents.push(
      new GroupPurchaseConfirmedEvent({
        aggregateId: this.id,
        participantIds: this._participants.filter(p => p.isActive()).map(p => p.userId),
        targetPrice: this.targetPrice.amount,
        discountPercentage: this.getDiscountPercentage(),
        productId: this.productId,
      }),
    );
  }

  getActiveParticipantCount(): number {
    return this._participants.filter(p => p.isActive()).length;
  }

  isActive(): boolean {
    return this._status === GroupPurchaseStatus.ACTIVE;
  }

  isConfirmed(): boolean {
    return this._status === GroupPurchaseStatus.CONFIRMED;
  }

  isExpired(): boolean {
    return this._status === GroupPurchaseStatus.EXPIRED;
  }

  canAcceptParticipants(): boolean {
    return this.isActive() && new Date() < this.expiresAt;
  }

  hasParticipant(userId: string): boolean {
    return this._participants.some(p => p.userId === userId && p.isActive());
  }

  getDiscountPercentage(): number {
    return this.targetPrice.discountPercentageFrom(this.originalPrice);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
