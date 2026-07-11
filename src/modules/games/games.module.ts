import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateDrawSchedule } from './application/use-cases/create-draw-schedule.use-case';
import { CreateGame } from './application/use-cases/create-game.use-case';
import { DeleteDrawSchedule } from './application/use-cases/delete-draw-schedule.use-case';
import { FindGameBySlug } from './application/use-cases/find-game-by-slug.use-case';
import { ListDrawSchedules } from './application/use-cases/list-draw-schedules.use-case';
import { ListGames } from './application/use-cases/list-games.use-case';
import { ResolveNextDraw } from './application/use-cases/resolve-next-draw.use-case';
import { SeedInitialGames } from './application/use-cases/seed-initial-games.use-case';
import { SeedInitialSchedules } from './application/use-cases/seed-initial-schedules.use-case';
import { ToggleGame } from './application/use-cases/toggle-game.use-case';
import { UpdateDrawSchedule } from './application/use-cases/update-draw-schedule.use-case';
import { UpdateGame } from './application/use-cases/update-game.use-case';
import { DRAW_SCHEDULES_REPOSITORY } from './domain/repositories/draw-schedules.repository';
import { GAMES_REPOSITORY } from './domain/repositories/games.repository';
import { GamesBootstrapService } from './infrastructure/bootstrap/games-bootstrap.service';
import { DrawSchedulesController } from './infrastructure/http/controllers/draw-schedules.controller';
import { GamesController } from './infrastructure/http/controllers/games.controller';
import { DrawScheduleOrmEntity } from './infrastructure/persistence/entities/draw-schedule.orm-entity';
import { GameOrmEntity } from './infrastructure/persistence/entities/game.orm-entity';
import { TypeOrmDrawSchedulesRepository } from './infrastructure/persistence/repositories/typeorm-draw-schedules.repository';
import { TypeOrmGamesRepository } from './infrastructure/persistence/repositories/typeorm-games.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameOrmEntity, DrawScheduleOrmEntity]),
  ],
  controllers: [GamesController, DrawSchedulesController],
  providers: [
    { provide: GAMES_REPOSITORY, useClass: TypeOrmGamesRepository },
    {
      provide: DRAW_SCHEDULES_REPOSITORY,
      useClass: TypeOrmDrawSchedulesRepository,
    },
    CreateGame,
    ListGames,
    FindGameBySlug,
    UpdateGame,
    ToggleGame,
    SeedInitialGames,
    SeedInitialSchedules,
    ResolveNextDraw,
    ListDrawSchedules,
    CreateDrawSchedule,
    UpdateDrawSchedule,
    DeleteDrawSchedule,
    GamesBootstrapService,
  ],
  exports: [
    GAMES_REPOSITORY,
    DRAW_SCHEDULES_REPOSITORY,
    FindGameBySlug,
    ResolveNextDraw,
  ],
})
export class GamesModule {}
