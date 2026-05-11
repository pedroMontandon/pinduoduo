import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { GroupPurchaseStatus } from '../../domain/aggregates/group-purchase.aggregate';
import { GroupPurchaseParticipantTypeOrmEntity } from './group-purchase-participant.typeorm-entity';

@Entity('group_purchases')
export class GroupPurchaseTypeOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column('uuid')
  creatorId: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  originalPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  targetPrice: number;

  @Column()
  minimumParticipants: number;

  @Column({ type: 'enum', enum: GroupPurchaseStatus, default: GroupPurchaseStatus.ACTIVE })
  status: GroupPurchaseStatus;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  confirmedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => GroupPurchaseParticipantTypeOrmEntity, p => p.groupPurchase)
  participants: GroupPurchaseParticipantTypeOrmEntity[];
}
