import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { GroupPurchase, GroupPurchaseStatus } from '../../domain/aggregates/group-purchase.aggregate';
import { GroupPurchaseParticipant, ParticipantStatus } from '../../domain/entities/group-purchase-participant.entity';
import { GroupPurchaseRepository } from '../../domain/repositories/group-purchase.repository';
import { Price } from '../../domain/value-objects/price.vo';
import { GroupPurchaseParticipantTypeOrmEntity } from './group-purchase-participant.typeorm-entity';
import { GroupPurchaseTypeOrmEntity } from './group-purchase.typeorm-entity';

@Injectable()
export class GroupPurchaseTypeOrmRepository implements GroupPurchaseRepository {
  constructor(
    @InjectRepository(GroupPurchaseTypeOrmEntity)
    private readonly groupRepo: Repository<GroupPurchaseTypeOrmEntity>,
    @InjectRepository(GroupPurchaseParticipantTypeOrmEntity)
    private readonly participantRepo: Repository<GroupPurchaseParticipantTypeOrmEntity>,
  ) {}

  async save(groupPurchase: GroupPurchase): Promise<void> {
    const groupEntity = this.toGroupPersistence(groupPurchase);
    await this.groupRepo.save(groupEntity);

    const participantEntities = groupPurchase.participants.map(p =>
      this.toParticipantPersistence(p, groupPurchase.id),
    );
    if (participantEntities.length > 0) {
      await this.participantRepo.upsert(participantEntities, ['id']);
    }
  }

  async findById(id: string): Promise<GroupPurchase | null> {
    const entity = await this.groupRepo.findOne({ where: { id }, relations: ['participants'] });
    return entity ? this.toDomain(entity) : null;
  }

  async findByProductId(
    productId: string,
    skip = 0,
    take = 10,
  ): Promise<{ items: GroupPurchase[]; total: number }> {
    const [entities, total] = await this.groupRepo.findAndCount({
      where: { productId },
      relations: ['participants'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { items: entities.map(e => this.toDomain(e)), total };
  }

  async findActiveByProductId(productId: string): Promise<GroupPurchase[]> {
    const entities = await this.groupRepo.find({
      where: { productId, status: GroupPurchaseStatus.ACTIVE },
      relations: ['participants'],
      order: { createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findExpirableGroups(): Promise<GroupPurchase[]> {
    const entities = await this.groupRepo.find({
      where: { status: GroupPurchaseStatus.ACTIVE, expiresAt: LessThan(new Date()) },
      relations: ['participants'],
    });
    return entities.map(e => this.toDomain(e));
  }

  private toGroupPersistence(g: GroupPurchase): Omit<GroupPurchaseTypeOrmEntity, 'participants'> {
    return {
      id: g.id,
      productId: g.productId,
      creatorId: g.creatorId,
      title: g.title,
      description: g.description,
      originalPrice: g.originalPrice.amount,
      targetPrice: g.targetPrice.amount,
      minimumParticipants: g.minimumParticipants,
      status: g.status,
      expiresAt: g.expiresAt,
      confirmedAt: g.confirmedAt,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }

  private toParticipantPersistence(
    p: GroupPurchaseParticipant,
    groupPurchaseId: string,
  ): Omit<GroupPurchaseParticipantTypeOrmEntity, 'groupPurchase'> {
    return {
      id: p.id,
      groupPurchaseId,
      userId: p.userId,
      status: p.status,
      joinedAt: p.joinedAt,
    };
  }

  private toDomain(entity: GroupPurchaseTypeOrmEntity): GroupPurchase {
    return GroupPurchase.reconstitute({
      id: entity.id,
      productId: entity.productId,
      creatorId: entity.creatorId,
      title: entity.title,
      description: entity.description,
      originalPrice: Price.reconstitute(Number(entity.originalPrice)),
      targetPrice: Price.reconstitute(Number(entity.targetPrice)),
      minimumParticipants: entity.minimumParticipants,
      participants: (entity.participants ?? []).map(p =>
        GroupPurchaseParticipant.reconstitute({
          id: p.id,
          userId: p.userId,
          status: p.status as ParticipantStatus,
          joinedAt: p.joinedAt,
        }),
      ),
      status: entity.status,
      expiresAt: entity.expiresAt,
      confirmedAt: entity.confirmedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
