import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Price } from '../../../domain/value-objects/price.vo';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../../domain/repositories/product.repository';
import { UpdateProductDto } from './update-product.dto';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string, dto: UpdateProductDto): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let updatedProduct = product;

    if (dto.price !== undefined) {
      const newPrice = Price.create(dto.price);
      updatedProduct = updatedProduct.updatePrice(newPrice);
    }

    if (dto.name !== undefined || dto.description !== undefined || dto.stock !== undefined) {
      updatedProduct = updatedProduct.update({
        name: dto.name,
        description: dto.description,
        stock: dto.stock,
      });
    }

    await this.productRepository.save(updatedProduct);
  }
}
