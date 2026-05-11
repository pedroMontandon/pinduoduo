import { Product } from '../../../src/modules/product/domain/entities/product.entity';
import { Price } from '../../../src/modules/product/domain/value-objects/price.vo';

const makePrice = (amount = 100) => Price.create(amount, 'USD');

const makeProduct = (overrides: Partial<{ stock: number; name: string; description: string }> = {}) =>
  Product.reconstitute({
    id: 'product-1',
    name: overrides.name ?? 'Test Product',
    description: overrides.description ?? 'A test product',
    price: makePrice(),
    stock: overrides.stock ?? 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('Product', () => {
  describe('create', () => {
    it('creates a product with all provided fields', () => {
      const price = makePrice(49.99);
      const product = Product.create({ name: 'Widget', description: 'A widget', price, stock: 20 });

      expect(product.name).toBe('Widget');
      expect(product.description).toBe('A widget');
      expect(product.price).toBe(price);
      expect(product.stock).toBe(20);
    });

    it('assigns a unique UUID id', () => {
      const p1 = Product.create({ name: 'A', description: 'A', price: makePrice(), stock: 1 });
      const p2 = Product.create({ name: 'B', description: 'B', price: makePrice(), stock: 1 });

      expect(p1.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(p1.id).not.toBe(p2.id);
    });

    it('sets createdAt and updatedAt to the same timestamp', () => {
      const before = new Date();
      const product = Product.create({ name: 'A', description: 'A', price: makePrice(), stock: 5 });
      const after = new Date();

      expect(product.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(product.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(product.createdAt.getTime()).toBe(product.updatedAt.getTime());
    });

    it('throws when stock is negative', () => {
      expect(() =>
        Product.create({ name: 'A', description: 'A', price: makePrice(), stock: -1 }),
      ).toThrow('Stock cannot be negative');
    });

    it('accepts zero stock', () => {
      const product = Product.create({ name: 'A', description: 'A', price: makePrice(), stock: 0 });
      expect(product.stock).toBe(0);
    });
  });

  describe('reconstitute', () => {
    it('rebuilds a product with exact field values', () => {
      const id = 'fixed-id';
      const createdAt = new Date('2023-06-01');
      const updatedAt = new Date('2023-06-15');
      const price = makePrice(200);

      const product = Product.reconstitute({
        id,
        name: 'Reconstituted',
        description: 'From storage',
        price,
        stock: 7,
        createdAt,
        updatedAt,
      });

      expect(product.id).toBe(id);
      expect(product.name).toBe('Reconstituted');
      expect(product.stock).toBe(7);
      expect(product.createdAt).toBe(createdAt);
      expect(product.updatedAt).toBe(updatedAt);
    });
  });

  describe('decreaseStock', () => {
    it('returns a new product with reduced stock', () => {
      const product = makeProduct({ stock: 10 });

      const updated = product.decreaseStock(3);

      expect(updated.stock).toBe(7);
    });

    it('preserves all other fields on the returned product', () => {
      const product = makeProduct({ stock: 10 });

      const updated = product.decreaseStock(1);

      expect(updated.id).toBe(product.id);
      expect(updated.name).toBe(product.name);
      expect(updated.description).toBe(product.description);
      expect(updated.price).toBe(product.price);
      expect(updated.createdAt).toBe(product.createdAt);
    });

    it('does not mutate the original product', () => {
      const product = makeProduct({ stock: 10 });

      product.decreaseStock(5);

      expect(product.stock).toBe(10);
    });

    it('updates updatedAt on the returned product', () => {
      const product = makeProduct({ stock: 10 });
      const before = new Date();

      const updated = product.decreaseStock(1);

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updated.updatedAt).not.toBe(product.updatedAt);
    });

    it('throws when quantity exceeds available stock', () => {
      const product = makeProduct({ stock: 5 });

      expect(() => product.decreaseStock(6)).toThrow('Insufficient stock');
    });

    it('allows decreasing by the exact stock amount', () => {
      const product = makeProduct({ stock: 5 });

      const updated = product.decreaseStock(5);

      expect(updated.stock).toBe(0);
    });

    it('allows decreasing by zero', () => {
      const product = makeProduct({ stock: 5 });

      const updated = product.decreaseStock(0);

      expect(updated.stock).toBe(5);
    });
  });

  describe('increaseStock', () => {
    it('returns a new product with increased stock', () => {
      const product = makeProduct({ stock: 5 });

      const updated = product.increaseStock(3);

      expect(updated.stock).toBe(8);
    });

    it('preserves all other fields on the returned product', () => {
      const product = makeProduct({ stock: 5 });

      const updated = product.increaseStock(2);

      expect(updated.id).toBe(product.id);
      expect(updated.name).toBe(product.name);
      expect(updated.price).toBe(product.price);
      expect(updated.createdAt).toBe(product.createdAt);
    });

    it('does not mutate the original product', () => {
      const product = makeProduct({ stock: 5 });

      product.increaseStock(10);

      expect(product.stock).toBe(5);
    });

    it('updates updatedAt on the returned product', () => {
      const product = makeProduct({ stock: 5 });
      const before = new Date();

      const updated = product.increaseStock(1);

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('allows increasing from zero stock', () => {
      const product = makeProduct({ stock: 0 });

      const updated = product.increaseStock(10);

      expect(updated.stock).toBe(10);
    });
  });

  describe('update', () => {
    it('updates the name when provided', () => {
      const product = makeProduct({ name: 'Old Name' });

      const updated = product.update({ name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe(product.description);
      expect(updated.stock).toBe(product.stock);
    });

    it('updates the description when provided', () => {
      const product = makeProduct({ description: 'Old desc' });

      const updated = product.update({ description: 'New desc' });

      expect(updated.description).toBe('New desc');
    });

    it('updates the stock when provided', () => {
      const product = makeProduct({ stock: 5 });

      const updated = product.update({ stock: 20 });

      expect(updated.stock).toBe(20);
    });

    it('preserves unchanged fields when doing a partial update', () => {
      const product = makeProduct({ name: 'Keep Me', stock: 7 });

      const updated = product.update({ description: 'Only this changes' });

      expect(updated.name).toBe('Keep Me');
      expect(updated.stock).toBe(7);
      expect(updated.id).toBe(product.id);
    });
  });

  describe('updatePrice', () => {
    it('returns a product with the new price', () => {
      const product = makeProduct();
      const newPrice = makePrice(299.99);

      const updated = product.updatePrice(newPrice);

      expect(updated.price).toBe(newPrice);
    });

    it('preserves other fields when updating price', () => {
      const product = makeProduct({ stock: 3 });
      const newPrice = makePrice(50);

      const updated = product.updatePrice(newPrice);

      expect(updated.id).toBe(product.id);
      expect(updated.stock).toBe(3);
      expect(updated.name).toBe(product.name);
    });
  });
});
