import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GroupPurchaseExpirationService } from '../../domain/services/group-purchase-expiration.service';

@Injectable()
export class ExpireGroupPurchasesJob {
  private readonly logger = new Logger(ExpireGroupPurchasesJob.name);

  constructor(private readonly expirationService: GroupPurchaseExpirationService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handle(): Promise<void> {
    this.logger.debug('Running group purchase expiration check...');
    await this.expirationService.expireOverdueGroups();
  }
}
