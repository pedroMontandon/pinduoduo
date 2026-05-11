import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ParticipantStatus } from '../../domain/entities/group-purchase-participant.entity';
import { GroupPurchaseTypeOrmEntity } from './group-purchase.typeorm-entity';

@Entity('group_purchase_participants')
@Index(['groupPurchaseId', 'userId'], { unique: true })
export class GroupPurchaseParticipantTypeOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  groupPurchaseId: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column({ type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.ACTIVE })
  status: ParticipantStatus;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => GroupPurchaseTypeOrmEntity, g => g.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupPurchaseId' })
  groupPurchase: GroupPurchaseTypeOrmEntity;
}
