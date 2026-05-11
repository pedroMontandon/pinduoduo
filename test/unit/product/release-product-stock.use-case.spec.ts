import { NotFoundException } from '@nestjs/common';
import { ReleaseProductStockUseCase } from '../../../src/modules/product/application/use-cases/release-product-stock/release-product-stock.use-case';
import { ProductRepository } from '../../../src/modules/product/domain/repositories/product.repository';
import { Product } from '../../../src/modules/product/domain/entities/product.entity';
import { Price } from '../../../src/modules/product/domain/value-objects/price.vo';

const makeProduct = (stock: number) =>
  Product.reconstitute({
    id: 'product-1',
    name: 'Test Product',
    description: 'A test product',
    price: Price.create(100, 'USD'),
    stock,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('ReleaseProductStockUseCase', () => {
  let useCase: ReleaseProductStockUseCase;
  let mockRepo: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new ReleaseProductStockUseCase(mockRepo);
  });

  it('increases stock by the given quantity and saves the updated product', async () => {
    const product = makeProduct(3);
    mockRepo.findById.mockResolvedValue(product);

    await useCase.execute('product-1', 10);

    expect(mockRepo.findById).toHaveBeenCalledWith('product-1');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const savedProduct: Product = mockRepo.save.mock.calls[0][0];
    expect(savedProduct.stock).toBe(13);
    expect(savedProduct.id).toBe('product-1');
  });

  it('throws NotFoundException when the product does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id', 5)).rejects.toThrow(NotFoundException);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('releases stock onto a product that had zero stock', async () => {
    const product = makeProduct(0);
    mockRepo.findById.mockResolvedValue(product);

    await useCase.execute('product-1', 7);

    const savedProduct: Product = mockRepo.save.mock.calls[0][0];
    expect(savedProduct.stock).toBe(7);
  });
});
