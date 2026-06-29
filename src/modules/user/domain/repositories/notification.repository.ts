import { Notification } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface NotificationRepository {
  saveAll(notifications: Notification[]): Promise<void>;
  findByUserId(
    userId: string,
    options: { skip: number; take: number },
  ): Promise<{ items: Notification[]; total: number }>;
  countUnread(userId: string): Promise<number>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}
