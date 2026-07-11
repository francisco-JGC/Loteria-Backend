import { randomUUID } from 'crypto';

import { AggregateRoot } from '../../../../shared/domain/aggregate-root';

export interface SalePointProps {
  name: string;
  code: string;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SalePoint extends AggregateRoot<SalePointProps> {
  private constructor(id: string, props: SalePointProps) {
    super(id, props);
  }

  static create(input: { name: string; code: string; ownerId: string }): SalePoint {
    const now = new Date();
    return new SalePoint(randomUUID(), {
      name: input.name,
      code: input.code,
      ownerId: input.ownerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(id: string, props: SalePointProps): SalePoint {
    return new SalePoint(id, props);
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  reassignOwner(newOwnerId: string): void {
    this.props.ownerId = newOwnerId;
    this.props.updatedAt = new Date();
  }
}
