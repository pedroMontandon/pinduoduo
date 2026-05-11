import { NotFoundException } from '@nestjs/common';
import { ReserveProductStockUseCase } from '../../../src/modules/product/application/use-cases/reserve-product-stock/reserve-product-stock.use-case';
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

describe('ReserveProductStockUseCase', () => {
  let useCase: ReserveProductStockUseCase;
  let mockRepo: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new ReserveProductStockUseCase(mockRepo);
  });

  it('decreases stock by the given quantity and saves the updated product', async () => {
    const product = makeProduct(10);
    mockRepo.findById.mockResolvedValue(product);

    await useCase.execute('product-1', 3);

    expect(mockRepo.findById).toHaveBeenCalledWith('product-1');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const savedProduct: Product = mockRepo.save.mock.calls[0][0];
    expect(savedProduct.stock).toBe(7);
    expect(savedProduct.id).toBe('product-1');
  });

  it('throws NotFoundException when the product does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id', 1)).rejects.toThrow(NotFoundException);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('propagates the error from decreaseStock when stock is insufficient', async () => {
    const product = makeProduct(2);
    mockRepo.findById.mockResolvedValue(product);

    await expect(useCase.execute('product-1', 5)).rejects.toThrow('Insufficient stock');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('reserves the exact amount of available stock (edge case)', async () => {
    const product = makeProduct(5);
    mockRepo.findById.mockResolvedValue(product);

    await useCase.execute('product-1', 5);

    const savedProduct: Product = mockRepo.save.mock.calls[0][0];
    expect(savedProduct.stock).toBe(0);
  });
});
