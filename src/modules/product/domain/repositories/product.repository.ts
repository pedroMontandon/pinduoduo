import { Product } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
  findAll(skip?: number, take?: number): Promise<{ items: Product[]; total: number }>;
  delete(id: string): Promise<void>;
}
