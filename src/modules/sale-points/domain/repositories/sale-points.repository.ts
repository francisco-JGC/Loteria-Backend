import { SalePoint } from '../entities/sale-point.entity';

export const SALE_POINTS_REPOSITORY = Symbol('SALE_POINTS_REPOSITORY');

export interface SalePointsRepository {
  save(salePoint: SalePoint): Promise<void>;
  findById(id: string): Promise<SalePoint | null>;
  findByCode(code: string): Promise<SalePoint | null>;
  findAll(): Promise<SalePoint[]>;
  findByOwner(ownerId: string): Promise<SalePoint[]>;
}
