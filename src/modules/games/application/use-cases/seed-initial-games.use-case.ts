import { Inject, Injectable, Logger } from '@nestjs/common';

import { Game } from '../../domain/entities/game.entity';
import {
  GAMES_REPOSITORY,
  type GamesRepository,
} from '../../domain/repositories/games.repository';
import { GameType } from '../../domain/value-objects/game-type';

interface InitialGame {
  slug: string;
  name: string;
  type: GameType;
  mainMultiplier: number | null;
  secondaryMultiplier: number | null;
}

const INITIAL_GAMES: readonly InitialGame[] = [
  { slug: 'diaria', name: 'Diaria', type: GameType.REGULAR, mainMultiplier: 80, secondaryMultiplier: null },
  { slug: 'juega3', name: 'Juega 3', type: GameType.THREE_DIGIT, mainMultiplier: 600, secondaryMultiplier: 100 },
  { slug: 'fechas', name: 'Fechas', type: GameType.DATE, mainMultiplier: 200, secondaryMultiplier: null },
  { slug: 'combo', name: 'Combo', type: GameType.FOUR_DIGIT, mainMultiplier: 4000, secondaryMultiplier: null },
  { slug: 'terminacion2', name: 'Terminación 2', type: GameType.REGULAR, mainMultiplier: 80, secondaryMultiplier: null },
  { slug: 'tica', name: 'Tica', type: GameType.REGULAR, mainMultiplier: 80, secondaryMultiplier: null },
  { slug: 'tresmonazo', name: 'Tresmonazo', type: GameType.THREE_DIGIT, mainMultiplier: 600, secondaryMultiplier: 100 },
  { slug: 'hondurena', name: 'Hondureña', type: GameType.REGULAR, mainMultiplier: 80, secondaryMultiplier: null },
  { slug: 'gana3', name: 'Gana 3', type: GameType.THREE_DIGIT, mainMultiplier: 600, secondaryMultiplier: 100 },
  { slug: 'primera', name: 'Primera', type: GameType.REGULAR, mainMultiplier: 80, secondaryMultiplier: null },
  { slug: 'salvadorena', name: 'Salvadoreña', type: GameType.REGULAR, mainMultiplier: 80, secondaryMultiplier: null },
  { slug: 'rifas', name: 'Rifas', type: GameType.REGULAR, mainMultiplier: 80, secondaryMultiplier: null },
  { slug: 'multisorteo', name: 'Multi Sorteo', type: GameType.MULTI_SORTEO, mainMultiplier: null, secondaryMultiplier: null },
];

@Injectable()
export class SeedInitialGames {
  private readonly logger = new Logger(SeedInitialGames.name);

  constructor(
    @Inject(GAMES_REPOSITORY) private readonly games: GamesRepository,
  ) {}

  async execute(): Promise<number> {
    const existing = await this.games.count();
    if (existing > 0) return 0;

    for (let i = 0; i < INITIAL_GAMES.length; i++) {
      const template = INITIAL_GAMES[i];
      const game = Game.create({
        slug: template.slug,
        name: template.name,
        type: template.type,
        mainMultiplier: template.mainMultiplier,
        secondaryMultiplier: template.secondaryMultiplier,
        imagePath: `assets/images/games/${template.slug}.jpeg`,
        orderIndex: i + 1,
      });
      await this.games.save(game);
    }

    this.logger.log(`Seeded ${INITIAL_GAMES.length} initial games`);
    return INITIAL_GAMES.length;
  }
}
