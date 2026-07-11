import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { NotFoundError, ValidationError } from '../../../../shared/domain/errors/domain.error';
import type { DrawSchedule } from '../../domain/entities/draw-schedule.entity';
import {
  DRAW_SCHEDULES_REPOSITORY,
  type DrawSchedulesRepository,
} from '../../domain/repositories/draw-schedules.repository';
import {
  GAMES_REPOSITORY,
  type GamesRepository,
} from '../../domain/repositories/games.repository';

export interface ResolveNextDrawInput {
  gameId: string;
  at: Date;
}

export interface ResolveNextDrawOutput {
  drawAt: Date;
  cutoffMinutes: number;
}

const LOOK_AHEAD_DAYS = 7;

@Injectable()
export class ResolveNextDraw
  implements UseCase<ResolveNextDrawInput, ResolveNextDrawOutput>
{
  constructor(
    @Inject(GAMES_REPOSITORY) private readonly games: GamesRepository,
    @Inject(DRAW_SCHEDULES_REPOSITORY)
    private readonly schedules: DrawSchedulesRepository,
  ) {}

  async execute(input: ResolveNextDrawInput): Promise<ResolveNextDrawOutput> {
    const game = await this.games.findById(input.gameId);
    if (!game) throw new NotFoundError('Game', input.gameId);

    const all = await this.schedules.findByGameId(input.gameId);
    const active = all.filter((s) => s.isActive);
    if (active.length === 0) {
      throw new ValidationError(
        `Game "${game.slug}" has no active draw schedules`,
      );
    }

    const nowMinutes = input.at.getHours() * 60 + input.at.getMinutes();

    for (let offset = 0; offset <= LOOK_AHEAD_DAYS; offset++) {
      const day = new Date(input.at);
      day.setDate(day.getDate() + offset);
      const dayOfWeek = day.getDay();
      const candidates = this.candidatesFor(active, dayOfWeek);
      if (candidates.length === 0) continue;

      for (const schedule of candidates) {
        const drawMinutes = schedule.toMinutes();
        const cutoffThreshold = drawMinutes - schedule.cutoffMinutes;
        const passesCutoff =
          offset > 0 || nowMinutes < cutoffThreshold;
        if (!passesCutoff) continue;

        const drawAt = new Date(day);
        const [h, m] = schedule.drawTime.split(':').map(Number);
        drawAt.setHours(h, m, 0, 0);
        return { drawAt, cutoffMinutes: schedule.cutoffMinutes };
      }
    }

    throw new ValidationError(
      `No upcoming draw found for game "${game.slug}"`,
    );
  }

  private candidatesFor(
    schedules: DrawSchedule[],
    dayOfWeek: number,
  ): DrawSchedule[] {
    return schedules
      .filter((s) => s.appliesTo(dayOfWeek))
      .sort((a, b) => a.toMinutes() - b.toMinutes());
  }
}
