export class Price {
  readonly amount: number;
  readonly currency: string;

  private constructor(amount: number, currency: string = 'USD') {
    if (amount < 0) {
      throw new Error('Price cannot be negative');
    }
    this.amount = amount;
    this.currency = currency;
  }

  static create(amount: number, currency: string = 'USD'): Price {
    return new Price(amount, currency);
  }

  static reconstitute(amount: number, currency: string): Price {
    return new Price(amount, currency);
  }

  equals(other: Price): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
