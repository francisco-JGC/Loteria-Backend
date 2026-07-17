import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class MovementsBalanceQueryDto {
  @IsOptional()
  @IsUUID()
  salePointId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
