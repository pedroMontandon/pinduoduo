import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateGroupPurchaseUseCase } from './application/use-cases/create-group-purchase/create-group-purchase.use-case';
import { GetGroupPurchaseUseCase } from './application/use-cases/get-group-purchase/get-group-purchase.use-case';
import { JoinGroupPurchaseUseCase } from './application/use-cases/join-group-purchase/join-group-purchase.use-case';
import { LeaveGroupPurchaseUseCase } from './application/use-cases/leave-group-purchase/leave-group-purchase.use-case';
import { ListGroupPurchasesUseCase } from './application/use-cases/list-group-purchases/list-group-purchases.use-case';
import { GroupPurchaseExpirationService } from './domain/services/group-purchase-expiration.service';
import { GROUP_PURCHASE_REPOSITORY } from './domain/repositories/group-purchase.repository';
import { GroupPurchaseParticipantTypeOrmEntity } from './infrastructure/persistence/group-purchase-participant.typeorm-entity';
import { GroupPurchaseTypeOrmEntity } from './infrastructure/persistence/group-purchase.typeorm-entity';
import { GroupPurchaseTypeOrmRepository } from './infrastructure/persistence/group-purchase.typeorm-repository';
import { ExpireGroupPurchasesJob } from './infrastructure/jobs/expire-group-purchases.job';
import { GroupPurchaseController } from './presentation/controllers/group-purchase.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupPurchaseTypeOrmEntity, GroupPurchaseParticipantTypeOrmEntity]),
  ],
  controllers: [GroupPurchaseController],
  providers: [
    CreateGroupPurchaseUseCase,
    GetGroupPurchaseUseCase,
    JoinGroupPurchaseUseCase,
    LeaveGroupPurchaseUseCase,
    ListGroupPurchasesUseCase,
    GroupPurchaseExpirationService,
    ExpireGroupPurchasesJob,
    { provide: GROUP_PURCHASE_REPOSITORY, useClass: GroupPurchaseTypeOrmRepository },
  ],
})
export class GroupPurchaseModule {}
