import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GROUP_PURCHASE_REPOSITORY, GroupPurchaseRepository } from '../../../domain/repositories/group-purchase.repository';

@Injectable()
export class GetGroupPurchaseUseCase {
  constructor(
    @Inject(GROUP_PURCHASE_REPOSITORY)
    private readonly groupPurchaseRepository: GroupPurchaseRepository,
  ) {}

  async execute(id: string) {
    const group = await this.groupPurchaseRepository.findById(id);
    if (!group) {
      throw new NotFoundException('Group purchase not found');
    }

    return {
      id: group.id,
      productId: group.productId,
      creatorId: group.creatorId,
      title: group.title,
      description: group.description,
      originalPrice: group.originalPrice.amount,
      targetPrice: group.targetPrice.amount,
      discountPercentage: group.getDiscountPercentage(),
      minimumParticipants: group.minimumParticipants,
      currentParticipants: group.getActiveParticipantCount(),
      status: group.status,
      expiresAt: group.expiresAt,
      confirmedAt: group.confirmedAt,
      createdAt: group.createdAt,
    };
  }
}
