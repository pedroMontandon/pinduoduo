import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DomainEventPublisher } from '../../../../../shared/events/domain-event-publisher.service';
import { GROUP_PURCHASE_REPOSITORY, GroupPurchaseRepository } from '../../../domain/repositories/group-purchase.repository';

@Injectable()
export class LeaveGroupPurchaseUseCase {
  constructor(
    @Inject(GROUP_PURCHASE_REPOSITORY)
    private readonly groupPurchaseRepository: GroupPurchaseRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(groupPurchaseId: string, userId: string): Promise<void> {
    const groupPurchase = await this.groupPurchaseRepository.findById(groupPurchaseId);
    if (!groupPurchase) {
      throw new NotFoundException('Group purchase not found');
    }

    try {
      groupPurchase.removeParticipant(userId);
    } catch (err: unknown) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Cannot leave group purchase');
    }

    await this.groupPurchaseRepository.save(groupPurchase);
    this.eventPublisher.publishAll(groupPurchase.getDomainEvents());
    groupPurchase.clearDomainEvents();
  }
}
