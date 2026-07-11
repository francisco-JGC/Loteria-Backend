import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { UserRole } from '../../../users/domain/value-objects/user-role';
import {
  TICKETS_REPOSITORY,
  type TicketsRepository,
} from '../../domain/repositories/tickets.repository';
import { TicketStatus } from '../../domain/value-objects/ticket-status';
import { toTicketOutput, type TicketOutput } from '../dtos/ticket.output';
import {
  TicketEvaluator,
  type TicketLineEvaluation,
} from '../services/ticket-evaluator.service';

export interface ListWinningTicketsInput {
  requesterId: string;
  requesterRole: UserRole;
  salePointId?: string;
  gameId?: string;
  sellerId?: string;
  from?: Date;
  to?: Date;
}

export interface WinningTicketOutput {
  ticket: TicketOutput;
  totalPrize: number;
  lines: TicketLineEvaluation[];
}

@Injectable()
export class ListWinningTickets
  implements UseCase<ListWinningTicketsInput, WinningTicketOutput[]>
{
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly tickets: TicketsRepository,
    private readonly evaluator: TicketEvaluator,
  ) {}

  async execute(
    input: ListWinningTicketsInput,
  ): Promise<WinningTicketOutput[]> {
    const effectiveSellerId =
      input.requesterRole === UserRole.SELLER
        ? input.requesterId
        : input.sellerId;

    const items = await this.tickets.findMany({
      sellerId: effectiveSellerId,
      salePointId: input.salePointId,
      gameId: input.gameId,
      status: TicketStatus.VALID,
      from: input.from,
      to: input.to,
      limit: 1000,
      offset: 0,
    });

    const winners: WinningTicketOutput[] = [];
    for (const ticket of items) {
      const evaluation = await this.evaluator.evaluate(ticket);
      if (!evaluation.isWinner) continue;
      winners.push({
        ticket: toTicketOutput(ticket),
        totalPrize: evaluation.totalPrize,
        lines: evaluation.lines,
      });
    }
    return winners;
  }
}
