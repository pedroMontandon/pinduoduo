import { randomUUID } from 'crypto';
import { Price } from '../value-objects/price.vo';

export class Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: Price;
  readonly stock: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: {
    id: string;
    name: string;
    description: string;
    price: Price;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    if (props.stock < 0) {
      throw new Error('Stock cannot be negative');
    }
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.stock = props.stock;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    name: string;
    description: string;
    price: Price;
    stock: number;
  }): Product {
    const now = new Date();
    return new Product({
      id: randomUUID(),
      name: props.name,
      description: props.description,
      price: props.price,
      stock: props.stock,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: {
    id: string;
    name: string;
    description: string;
    price: Price;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    return new Product(props);
  }

  decreaseStock(quantity: number): Product {
    if (quantity > this.stock) {
      throw new Error('Insufficient stock');
    }
    return Product.reconstitute({
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock - quantity,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  increaseStock(quantity: number): Product {
    return Product.reconstitute({
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock + quantity,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  updatePrice(newPrice: Price): Product {
    return Product.reconstitute({
      id: this.id,
      name: this.name,
      description: this.description,
      price: newPrice,
      stock: this.stock,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  update(props: { name?: string; description?: string; stock?: number }): Product {
    return Product.reconstitute({
      id: this.id,
      name: props.name ?? this.name,
      description: props.description ?? this.description,
      price: this.price,
      stock: props.stock ?? this.stock,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
