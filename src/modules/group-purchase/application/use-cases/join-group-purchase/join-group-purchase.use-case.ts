import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DomainEventPublisher } from '../../../../../shared/events/domain-event-publisher.service';
import { GROUP_PURCHASE_REPOSITORY, GroupPurchaseRepository } from '../../../domain/repositories/group-purchase.repository';

@Injectable()
export class JoinGroupPurchaseUseCase {
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
      groupPurchase.addParticipant(userId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cannot join group purchase';
      if (message.includes('already joined')) throw new ConflictException(message);
      throw new BadRequestException(message);
    }

    await this.groupPurchaseRepository.save(groupPurchase);
    this.eventPublisher.publishAll(groupPurchase.getDomainEvents());
    groupPurchase.clearDomainEvents();
  }
}
