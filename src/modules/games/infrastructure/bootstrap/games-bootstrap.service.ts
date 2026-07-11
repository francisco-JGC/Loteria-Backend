import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';

import { SeedInitialGames } from '../../application/use-cases/seed-initial-games.use-case';

@Injectable()
export class GamesBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GamesBootstrapService.name);

  constructor(private readonly seedInitialGames: SeedInitialGames) {}

  async onApplicationBootstrap(): Promise<void> {
    const seeded = await this.seedInitialGames.execute();
    if (seeded === 0) {
      this.logger.log('Games already seeded, skipping');
    }
  }
}
