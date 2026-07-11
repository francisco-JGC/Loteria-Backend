import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { NotFoundError } from '../../../../shared/domain/errors/domain.error';
import {
  DRAW_SCHEDULES_REPOSITORY,
  type DrawSchedulesRepository,
} from '../../domain/repositories/draw-schedules.repository';
import {
  toDrawScheduleOutput,
  type DrawScheduleOutput,
} from '../dtos/draw-schedule.output';

export interface UpdateDrawScheduleApplicationInput {
  id: string;
  dayOfWeek?: number | null;
  drawTime?: string;
  cutoffMinutes?: number;
  isActive?: boolean;
}

@Injectable()
export class UpdateDrawSchedule
  implements UseCase<UpdateDrawScheduleApplicationInput, DrawScheduleOutput>
{
  constructor(
    @Inject(DRAW_SCHEDULES_REPOSITORY)
    private readonly schedules: DrawSchedulesRepository,
  ) {}

  async execute(
    input: UpdateDrawScheduleApplicationInput,
  ): Promise<DrawScheduleOutput> {
    const schedule = await this.schedules.findById(input.id);
    if (!schedule) throw new NotFoundError('DrawSchedule', input.id);

    schedule.update({
      dayOfWeek: input.dayOfWeek,
      drawTime: input.drawTime,
      cutoffMinutes: input.cutoffMinutes,
      isActive: input.isActive,
    });
    await this.schedules.save(schedule);
    return toDrawScheduleOutput(schedule);
  }
}
