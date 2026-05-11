import { GroupPurchase } from '../aggregates/group-purchase.aggregate';

export const GROUP_PURCHASE_REPOSITORY = Symbol('GROUP_PURCHASE_REPOSITORY');

export interface GroupPurchaseRepository {
  save(groupPurchase: GroupPurchase): Promise<void>;
  findById(id: string): Promise<GroupPurchase | null>;
  findByProductId(productId: string, skip?: number, take?: number): Promise<{ items: GroupPurchase[]; total: number }>;
  findActiveByProductId(productId: string): Promise<GroupPurchase[]>;
  findExpirableGroups(): Promise<GroupPurchase[]>;
}
