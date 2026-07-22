import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpsertGamePrizeHttpDto {
  @IsUUID()
  salePointId!: string;

  @IsUUID()
  gameId!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mainMultiplier: number | null = null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  secondaryMultiplier: number | null = null;
}
