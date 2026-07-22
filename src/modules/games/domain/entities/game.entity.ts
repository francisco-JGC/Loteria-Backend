import { randomUUID } from 'crypto';

import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { ValidationError } from '../../../../shared/domain/errors/domain.error';
import { GameType } from '../value-objects/game-type';

export interface GameProps {
  slug: string;
  name: string;
  type: GameType;
  exactMultiplier: number | null;
  easyMultiplier: number | null;
  imagePath: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGameInput {
  slug: string;
  name: string;
  type: GameType;
  exactMultiplier: number | null;
  easyMultiplier: number | null;
  imagePath: string | null;
  orderIndex: number;
}

export interface UpdateGameInput {
  name?: string;
  exactMultiplier?: number | null;
  easyMultiplier?: number | null;
  imagePath?: string | null;
  orderIndex?: number;
}

export class Game extends AggregateRoot<GameProps> {
  private constructor(id: string, props: GameProps) {
    super(id, props);
  }

  static create(input: CreateGameInput): Game {
    Game.assertMultipliersMatchType(
      input.type,
      input.exactMultiplier,
      input.easyMultiplier,
    );
    const now = new Date();
    return new Game(randomUUID(), {
      slug: input.slug,
      name: input.name,
      type: input.type,
      exactMultiplier: input.exactMultiplier,
      easyMultiplier: input.easyMultiplier,
      imagePath: input.imagePath,
      orderIndex: input.orderIndex,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(id: string, props: GameProps): Game {
    return new Game(id, props);
  }

  get slug(): string {
    return this.props.slug;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): GameType {
    return this.props.type;
  }

  get exactMultiplier(): number | null {
    return this.props.exactMultiplier;
  }

  get easyMultiplier(): number | null {
    return this.props.easyMultiplier;
  }

  get imagePath(): string | null {
    return this.props.imagePath;
  }

  get orderIndex(): number {
    return this.props.orderIndex;
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

  update(input: UpdateGameInput): void {
    const nextMain = input.exactMultiplier ?? this.props.exactMultiplier;
    const nextSecondary =
      input.easyMultiplier ?? this.props.easyMultiplier;

    Game.assertMultipliersMatchType(this.props.type, nextMain, nextSecondary);

    if (input.name !== undefined) this.props.name = input.name;
    if (input.imagePath !== undefined) this.props.imagePath = input.imagePath;
    if (input.orderIndex !== undefined) this.props.orderIndex = input.orderIndex;
    this.props.exactMultiplier = nextMain;
    this.props.easyMultiplier = nextSecondary;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  private static assertMultipliersMatchType(
    type: GameType,
    main: number | null,
    secondary: number | null,
  ): void {
    const requiresMain = type !== GameType.MULTI_SORTEO;
    const requiresSecondary = type === GameType.THREE_DIGIT;

    if (requiresMain && (main === null || main <= 0)) {
      throw new ValidationError(
        `Game type "${type}" requires a positive exactMultiplier`,
      );
    }
    if (!requiresMain && main !== null) {
      throw new ValidationError(
        `Game type "${type}" must not define a exactMultiplier`,
      );
    }
    if (requiresSecondary && (secondary === null || secondary <= 0)) {
      throw new ValidationError(
        `Game type "${type}" requires a positive easyMultiplier`,
      );
    }
    if (!requiresSecondary && secondary !== null) {
      throw new ValidationError(
        `Game type "${type}" must not define a easyMultiplier`,
      );
    }
  }
}
