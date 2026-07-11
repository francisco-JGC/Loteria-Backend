import type { Game } from '../../domain/entities/game.entity';
import type { GameType } from '../../domain/value-objects/game-type';

export interface GameOutput {
  id: string;
  slug: string;
  name: string;
  type: GameType;
  mainMultiplier: number | null;
  secondaryMultiplier: number | null;
  imagePath: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const toGameOutput = (game: Game): GameOutput => ({
  id: game.id,
  slug: game.slug,
  name: game.name,
  type: game.type,
  mainMultiplier: game.mainMultiplier,
  secondaryMultiplier: game.secondaryMultiplier,
  imagePath: game.imagePath,
  orderIndex: game.orderIndex,
  isActive: game.isActive,
  createdAt: game.createdAt,
  updatedAt: game.updatedAt,
});
