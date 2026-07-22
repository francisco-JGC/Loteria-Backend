import { randomUUID } from 'crypto';

import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { ValidationError } from '../../../../shared/domain/errors/domain.error';

export interface SalePointGamePrizeProps {
  salePointId: string;
  gameId: string;
  /** Overrides `games.main_multiplier`. Null = inherit game default. */
  mainMultiplier: number | null;
  /** Overrides `games.secondary_multiplier`. Null = inherit game default. */
  secondaryMultiplier: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Per-`(sale_point, game)` payout override. Absence of a row means "use the
 * game's default multipliers"; both fields on a row are independently
 * nullable so operators can override just one side and inherit the other.
 */
export class SalePointGamePrize extends AggregateRoot<SalePointGamePrizeProps> {
  private constructor(id: string, props: SalePointGamePrizeProps) {
    super(id, props);
  }

  static create(input: {
    salePointId: string;
    gameId: string;
    mainMultiplier: number | null;
    secondaryMultiplier: number | null;
  }): SalePointGamePrize {
    SalePointGamePrize.assertMultiplier(input.mainMultiplier, 'main');
    SalePointGamePrize.assertMultiplier(
      input.secondaryMultiplier,
      'secondary',
    );
    const now = new Date();
    return new SalePointGamePrize(randomUUID(), {
      salePointId: input.salePointId,
      gameId: input.gameId,
      mainMultiplier: input.mainMultiplier,
      secondaryMultiplier: input.secondaryMultiplier,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(id: string, props: SalePointGamePrizeProps): SalePointGamePrize {
    return new SalePointGamePrize(id, props);
  }

  updateMultipliers(
    mainMultiplier: number | null,
    secondaryMultiplier: number | null,
  ): void {
    SalePointGamePrize.assertMultiplier(mainMultiplier, 'main');
    SalePointGamePrize.assertMultiplier(secondaryMultiplier, 'secondary');
    this.props.mainMultiplier = mainMultiplier;
    this.props.secondaryMultiplier = secondaryMultiplier;
    this.props.updatedAt = new Date();
  }

  /** True when both overrides are cleared — caller should delete the row. */
  get isEmpty(): boolean {
    return this.mainMultiplier === null && this.secondaryMultiplier === null;
  }

  get salePointId(): string {
    return this.props.salePointId;
  }

  get gameId(): string {
    return this.props.gameId;
  }

  get mainMultiplier(): number | null {
    return this.props.mainMultiplier;
  }

  get secondaryMultiplier(): number | null {
    return this.props.secondaryMultiplier;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private static assertMultiplier(
    value: number | null,
    label: 'main' | 'secondary',
  ): void {
    if (value === null) return;
    if (!Number.isInteger(value) || value < 0) {
      throw new ValidationError(
        `${label} multiplier must be a non-negative integer`,
      );
    }
  }
}
