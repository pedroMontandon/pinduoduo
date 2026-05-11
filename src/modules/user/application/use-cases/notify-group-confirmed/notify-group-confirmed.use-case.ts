import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotifyGroupConfirmedUseCase {
  private readonly logger = new Logger(NotifyGroupConfirmedUseCase.name);

  execute(groupPurchaseId: string, participantIds: string[], discountPercentage: number): void {
    this.logger.log(
      `Group purchase ${groupPurchaseId} confirmed with ${discountPercentage}% discount. ` +
        `Notifying ${participantIds.length} participant(s): [${participantIds.join(', ')}]`,
    );
  }
}
