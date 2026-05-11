import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { ProductTypeOrmEntity } from './product.typeorm-entity';

@Injectable()
export class ProductTypeOrmRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductTypeOrmEntity)
    private readonly repo: Repository<ProductTypeOrmEntity>,
  ) {}

  async save(product: Product): Promise<void> {
    const record = this.repo.create({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.amount,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
    await this.repo.save(record);
  }

  async findById(id: string): Promise<Product | null> {
    const record = await this.repo.findOne({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(skip: number = 0, take: number = 10): Promise<{ items: Product[]; total: number }> {
    const [records, total] = await this.repo.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return {
      items: records.map(record => this.toDomain(record)),
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(record: ProductTypeOrmEntity): Product {
    return Product.reconstitute({
      id: record.id,
      name: record.name,
      description: record.description,
      price: Price.reconstitute(Number(record.price), 'USD'),
      stock: record.stock,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
