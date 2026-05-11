import { randomUUID } from 'crypto';

export class User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly createdAt: Date;

  private constructor(props: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.name = props.name;
    this.createdAt = props.createdAt;
  }

  static create(props: { email: string; passwordHash: string; name: string }): User {
    return new User({
      id: randomUUID(),
      email: props.email,
      passwordHash: props.passwordHash,
      name: props.name,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    createdAt: Date;
  }): User {
    return new User(props);
  }
}
