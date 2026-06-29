import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { NotificationTypeOrmEntity } from './notification.typeorm-entity';

@Injectable()
export class NotificationTypeOrmRepository implements NotificationRepository {
  constructor(
    @InjectRepository(NotificationTypeOrmEntity)
    private readonly repo: Repository<NotificationTypeOrmEntity>,
  ) {}

  async saveAll(notifications: Notification[]): Promise<void> {
    if (notifications.length === 0) return;
    const records = notifications.map(n => this.toPersistence(n));
    await this.repo.save(records);
  }

  async findByUserId(
    userId: string,
    options: { skip: number; take: number },
  ): Promise<{ items: Notification[]; total: number }> {
    const [records, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: options.skip,
      take: options.take,
    });
    return { items: records.map(r => this.toDomain(r)), total };
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, read: false } });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.repo.update({ id, userId }, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repo.update({ userId, read: false }, { read: true });
  }

  private toPersistence(n: Notification): NotificationTypeOrmEntity {
    return this.repo.create({
      id: n.id,
      userId: n.userId,
      message: n.message,
      groupPurchaseId: n.groupPurchaseId,
      read: n.read,
      createdAt: n.createdAt,
    });
  }

  private toDomain(record: NotificationTypeOrmEntity): Notification {
    return Notification.reconstitute({
      id: record.id,
      userId: record.userId,
      message: record.message,
      groupPurchaseId: record.groupPurchaseId,
      read: record.read,
      createdAt: record.createdAt,
    });
  }
}
