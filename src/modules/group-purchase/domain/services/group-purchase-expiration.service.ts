import { Inject, Injectable, Logger } from '@nestjs/common';
import { DomainEventPublisher } from '../../../../shared/events/domain-event-publisher.service';
import { GROUP_PURCHASE_REPOSITORY, GroupPurchaseRepository } from '../repositories/group-purchase.repository';

@Injectable()
export class GroupPurchaseExpirationService {
  private readonly logger = new Logger(GroupPurchaseExpirationService.name);

  constructor(
    @Inject(GROUP_PURCHASE_REPOSITORY)
    private readonly groupPurchaseRepository: GroupPurchaseRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async expireOverdueGroups(): Promise<void> {
    const groups = await this.groupPurchaseRepository.findExpirableGroups();

    for (const group of groups) {
      group.expire();
      const events = group.getDomainEvents();

      if (events.length > 0) {
        await this.groupPurchaseRepository.save(group);
        this.eventPublisher.publishAll(events);
        group.clearDomainEvents();
        this.logger.log(`Group purchase ${group.id} expired`);
      }
    }
  }
}
