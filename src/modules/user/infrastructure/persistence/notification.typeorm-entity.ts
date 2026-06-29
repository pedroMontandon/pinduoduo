import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('notifications')
export class NotificationTypeOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column('text')
  message: string;

  @Column({ type: 'uuid', nullable: true })
  groupPurchaseId: string | null;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
