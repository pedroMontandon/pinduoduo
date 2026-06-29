import { randomUUID } from 'crypto';

export class Notification {
  readonly id: string;
  readonly userId: string;
  readonly message: string;
  readonly groupPurchaseId: string | null;
  readonly read: boolean;
  readonly createdAt: Date;

  private constructor(props: {
    id: string;
    userId: string;
    message: string;
    groupPurchaseId: string | null;
    read: boolean;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.message = props.message;
    this.groupPurchaseId = props.groupPurchaseId;
    this.read = props.read;
    this.createdAt = props.createdAt;
  }

  static create(props: {
    userId: string;
    message: string;
    groupPurchaseId?: string | null;
  }): Notification {
    return new Notification({
      id: randomUUID(),
      userId: props.userId,
      message: props.message,
      groupPurchaseId: props.groupPurchaseId ?? null,
      read: false,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    message: string;
    groupPurchaseId: string | null;
    read: boolean;
    createdAt: Date;
  }): Notification {
    return new Notification(props);
  }
}
