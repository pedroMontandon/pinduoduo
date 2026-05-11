import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../../domain/repositories/product.repository';
import { ListProductsDto } from './list-products.dto';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(dto: ListProductsDto): Promise<{
    items: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      stock: number;
      createdAt: Date;
    }>;
    total: number;
    skip: number;
    take: number;
  }> {
    const skip = dto.skip ?? 0;
    const take = dto.take ?? 10;

    const result = await this.productRepository.findAll(skip, take);

    return {
      items: result.items.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price.amount,
        stock: product.stock,
        createdAt: product.createdAt,
      })),
      total: result.total,
      skip,
      take,
    };
  }
}
