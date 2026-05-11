import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../../domain/repositories/product.repository';

@Injectable()
export class ReleaseProductStockUseCase {
  private readonly logger = new Logger(ReleaseProductStockUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(productId: string, quantity: number): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    const updated = product.increaseStock(quantity);
    await this.productRepository.save(updated);
    this.logger.log(`Released ${quantity} units of product ${productId} (stock: ${updated.stock})`);
  }
}
