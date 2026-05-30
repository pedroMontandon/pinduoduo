import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../../domain/entities/product.entity';
import { Price } from '../../../domain/value-objects/price.vo';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../../domain/repositories/product.repository';
import { DomainEventPublisher } from '../../../../../shared/events/domain-event-publisher.service';
import { CreateProductDto } from './create-product.dto';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(dto: CreateProductDto): Promise<{ id: string }> {
    const price = Price.create(dto.price);
    const product = Product.create({
      name: dto.name,
      description: dto.description,
      price,
      stock: dto.stock,
    });

    await this.productRepository.save(product);
    this.eventPublisher.publishAll(product.getDomainEvents());
    product.clearDomainEvents();

    return { id: product.id };
  }
}
