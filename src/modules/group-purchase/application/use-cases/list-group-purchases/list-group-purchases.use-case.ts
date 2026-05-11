import { Inject, Injectable } from '@nestjs/common';
import { GROUP_PURCHASE_REPOSITORY, GroupPurchaseRepository } from '../../../domain/repositories/group-purchase.repository';
import { ListGroupPurchasesDto } from './list-group-purchases.dto';

@Injectable()
export class ListGroupPurchasesUseCase {
  constructor(
    @Inject(GROUP_PURCHASE_REPOSITORY)
    private readonly groupPurchaseRepository: GroupPurchaseRepository,
  ) {}

  async execute(dto: ListGroupPurchasesDto) {
    const skip = dto.skip ?? 0;
    const take = dto.take ?? 10;

    const result = await this.groupPurchaseRepository.findByProductId(dto.productId, skip, take);

    return {
      items: result.items.map(group => ({
        id: group.id,
        title: group.title,
        originalPrice: group.originalPrice.amount,
        targetPrice: group.targetPrice.amount,
        discountPercentage: group.getDiscountPercentage(),
        minimumParticipants: group.minimumParticipants,
        currentParticipants: group.getActiveParticipantCount(),
        status: group.status,
        expiresAt: group.expiresAt,
        confirmedAt: group.confirmedAt,
      })),
      total: result.total,
      skip,
      take,
    };
  }
}
