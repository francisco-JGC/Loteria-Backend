import type { GameType } from '../../domain/value-objects/game-type';

export interface CreateGameApplicationInput {
  slug: string;
  name: string;
  type: GameType;
  mainMultiplier: number | null;
  secondaryMultiplier: number | null;
  imagePath: string | null;
  orderIndex: number;
}
