import { SalePoint } from '../../domain/entities/sale-point.entity';

export interface SalePointOutput {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const toSalePointOutput = (salePoint: SalePoint): SalePointOutput => ({
  id: salePoint.id,
  name: salePoint.name,
  code: salePoint.code,
  ownerId: salePoint.ownerId,
  isActive: salePoint.isActive,
  createdAt: salePoint.createdAt,
  updatedAt: salePoint.updatedAt,
});
