import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/errors/domain.error';
import {
  TICKETS_REPOSITORY,
  type TicketsRepository,
} from '../../domain/repositories/tickets.repository';
import { toTicketOutput, type TicketOutput } from '../dtos/ticket.output';
import { TicketEvaluator } from '../services/ticket-evaluator.service';

export interface MarkTicketPaidInput {
  id: string;
  requesterId: string;
}

@Injectable()
export class MarkTicketPaid
  implements UseCase<MarkTicketPaidInput, TicketOutput>
{
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly tickets: TicketsRepository,
    private readonly evaluator: TicketEvaluator,
  ) {}

  async execute(input: MarkTicketPaidInput): Promise<TicketOutput> {
    const ticket = await this.tickets.findById(input.id);
    if (!ticket) throw new NotFoundError('Ticket', input.id);

    const evaluation = await this.evaluator.evaluate(ticket);
    if (evaluation.hasPendingDraw) {
      throw new ValidationError(
        'Cannot pay a ticket whose draw has not been recorded yet',
      );
    }
    if (!evaluation.isWinner) {
      throw new ValidationError('Ticket is not a winner');
    }

    ticket.markAsPaid(evaluation.totalPrize, input.requesterId);
    await this.tickets.save(ticket);
    return toTicketOutput(ticket);
  }
}
