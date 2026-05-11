export class Price {
  readonly amount: number;
  readonly currency: string;

  private constructor(amount: number, currency: string) {
    if (amount < 0) throw new Error('Price cannot be negative');
    this.amount = amount;
    this.currency = currency;
  }

  static create(amount: number, currency = 'USD'): Price {
    return new Price(amount, currency);
  }

  static reconstitute(amount: number, currency = 'USD'): Price {
    return new Price(amount, currency);
  }

  isLessThan(other: Price): boolean {
    return this.amount < other.amount;
  }

  equals(other: Price): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  discountPercentageFrom(original: Price): number {
    return ((original.amount - this.amount) / original.amount) * 100;
  }
}
