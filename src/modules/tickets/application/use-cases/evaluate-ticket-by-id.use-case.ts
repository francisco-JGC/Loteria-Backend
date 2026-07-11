import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { NotFoundError } from '../../../../shared/domain/errors/domain.error';
import {
  TICKETS_REPOSITORY,
  type TicketsRepository,
} from '../../domain/repositories/tickets.repository';
import { TicketStatus } from '../../domain/value-objects/ticket-status';
import {
  TicketEvaluator,
  type TicketLineEvaluation,
} from '../services/ticket-evaluator.service';

export interface EvaluateTicketByIdOutput {
  ticketId: string;
  folio: string;
  gameId: string;
  drawAt: Date;
  status: TicketStatus;
  isWinner: boolean;
  hasPendingDraw: boolean;
  totalPrize: number;
  lines: TicketLineEvaluation[];
}

@Injectable()
export class EvaluateTicketById
  implements UseCase<string, EvaluateTicketByIdOutput>
{
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly tickets: TicketsRepository,
    private readonly evaluator: TicketEvaluator,
  ) {}

  async execute(id: string): Promise<EvaluateTicketByIdOutput> {
    const ticket = await this.tickets.findById(id);
    if (!ticket) throw new NotFoundError('Ticket', id);

    const evaluation = await this.evaluator.evaluate(ticket);
    return {
      ticketId: ticket.id,
      folio: ticket.folio,
      gameId: ticket.gameId,
      drawAt: ticket.drawAt,
      status: ticket.status,
      isWinner: evaluation.isWinner,
      hasPendingDraw: evaluation.hasPendingDraw,
      totalPrize: evaluation.totalPrize,
      lines: evaluation.lines,
    };
  }
}
