import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/errors/domain.error';
import { UserRole } from '../../../users/domain/value-objects/user-role';
import {
  TICKETS_REPOSITORY,
  type TicketsRepository,
} from '../../domain/repositories/tickets.repository';
import { toTicketOutput, type TicketOutput } from '../dtos/ticket.output';

const SELLER_VOID_WINDOW_MINUTES = 5;

export interface VoidTicketInput {
  id: string;
  reason: string;
  requesterId: string;
  requesterRole: UserRole;
}

@Injectable()
export class VoidTicket implements UseCase<VoidTicketInput, TicketOutput> {
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly tickets: TicketsRepository,
  ) {}

  async execute(input: VoidTicketInput): Promise<TicketOutput> {
    const ticket = await this.tickets.findById(input.id);
    if (!ticket) throw new NotFoundError('Ticket', input.id);

    if (input.requesterRole === UserRole.SELLER) {
      if (!ticket.isOwnedBy(input.requesterId)) {
        throw new NotFoundError('Ticket', input.id);
      }
      const elapsed = ticket.minutesSinceCreation(new Date());
      if (elapsed > SELLER_VOID_WINDOW_MINUTES) {
        throw new ValidationError(
          `Sellers can only void tickets within ${SELLER_VOID_WINDOW_MINUTES} minutes`,
        );
      }
    }

    ticket.void(input.reason);
    await this.tickets.save(ticket);
    return toTicketOutput(ticket);
  }
}
