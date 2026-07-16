import { SalePoint } from '../../domain/entities/sale-point.entity';

export interface SalePointOutput {
  id: string;
  name: string;
  code: string;
  ownerPartnerId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const toSalePointOutput = (salePoint: SalePoint): SalePointOutput => ({
  id: salePoint.id,
  name: salePoint.name,
  code: salePoint.code,
  ownerPartnerId: salePoint.ownerPartnerId,
  isActive: salePoint.isActive,
  createdAt: salePoint.createdAt,
  updatedAt: salePoint.updatedAt,
});
