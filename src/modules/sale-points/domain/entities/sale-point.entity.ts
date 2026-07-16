import { randomUUID } from 'crypto';

import { AggregateRoot } from '../../../../shared/domain/aggregate-root';

export interface SalePointProps {
  name: string;
  code: string;
  /**
   * `users.id` of the partner (socio) that owns this sucursal. `null`
   * means the main admin/owner is the direct operator — those sucursales
   * are only visible to admins.
   */
  ownerPartnerId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SalePoint extends AggregateRoot<SalePointProps> {
  private constructor(id: string, props: SalePointProps) {
    super(id, props);
  }

  static create(input: {
    name: string;
    code: string;
    ownerPartnerId: string | null;
  }): SalePoint {
    const now = new Date();
    return new SalePoint(randomUUID(), {
      name: input.name,
      code: input.code,
      ownerPartnerId: input.ownerPartnerId,
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

  get ownerPartnerId(): string | null {
    return this.props.ownerPartnerId;
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

  reassignPartner(newOwnerPartnerId: string | null): void {
    this.props.ownerPartnerId = newOwnerPartnerId;
    this.props.updatedAt = new Date();
  }
}
