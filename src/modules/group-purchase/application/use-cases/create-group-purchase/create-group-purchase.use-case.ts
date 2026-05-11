import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DomainEventPublisher } from '../../../../../shared/events/domain-event-publisher.service';
import { GroupPurchase } from '../../../domain/aggregates/group-purchase.aggregate';
import { GROUP_PURCHASE_REPOSITORY, GroupPurchaseRepository } from '../../../domain/repositories/group-purchase.repository';
import { Price } from '../../../domain/value-objects/price.vo';
import { CreateGroupPurchaseDto } from './create-group-purchase.dto';

@Injectable()
export class CreateGroupPurchaseUseCase {
  constructor(
    @Inject(GROUP_PURCHASE_REPOSITORY)
    private readonly groupPurchaseRepository: GroupPurchaseRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(creatorId: string, dto: CreateGroupPurchaseDto): Promise<{ id: string }> {
    let groupPurchase: GroupPurchase;

    try {
      groupPurchase = GroupPurchase.create({
        productId: dto.productId,
        creatorId,
        title: dto.title,
        description: dto.description,
        originalPrice: Price.create(dto.originalPrice),
        targetPrice: Price.create(dto.targetPrice),
        minimumParticipants: dto.minimumParticipants,
        durationMinutes: dto.durationMinutes,
      });
    } catch (err: unknown) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Invalid group purchase');
    }

    await this.groupPurchaseRepository.save(groupPurchase);
    this.eventPublisher.publishAll(groupPurchase.getDomainEvents());
    groupPurchase.clearDomainEvents();

    return { id: groupPurchase.id };
  }
}
