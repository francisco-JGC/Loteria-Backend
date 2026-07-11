import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateGame } from './application/use-cases/create-game.use-case';
import { FindGameBySlug } from './application/use-cases/find-game-by-slug.use-case';
import { ListGames } from './application/use-cases/list-games.use-case';
import { SeedInitialGames } from './application/use-cases/seed-initial-games.use-case';
import { ToggleGame } from './application/use-cases/toggle-game.use-case';
import { UpdateGame } from './application/use-cases/update-game.use-case';
import { GAMES_REPOSITORY } from './domain/repositories/games.repository';
import { GamesBootstrapService } from './infrastructure/bootstrap/games-bootstrap.service';
import { GamesController } from './infrastructure/http/controllers/games.controller';
import { GameOrmEntity } from './infrastructure/persistence/entities/game.orm-entity';
import { TypeOrmGamesRepository } from './infrastructure/persistence/repositories/typeorm-games.repository';

@Module({
  imports: [TypeOrmModule.forFeature([GameOrmEntity])],
  controllers: [GamesController],
  providers: [
    { provide: GAMES_REPOSITORY, useClass: TypeOrmGamesRepository },
    CreateGame,
    ListGames,
    FindGameBySlug,
    UpdateGame,
    ToggleGame,
    SeedInitialGames,
    GamesBootstrapService,
  ],
  exports: [GAMES_REPOSITORY, FindGameBySlug],
})
export class GamesModule {}
