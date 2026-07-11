import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/errors/domain.error';
import {
  GAMES_REPOSITORY,
  type GamesRepository,
} from '../../../games/domain/repositories/games.repository';
import { ResolveNextDraw } from '../../../games/application/use-cases/resolve-next-draw.use-case';
import {
  SALE_POINTS_REPOSITORY,
  type SalePointsRepository,
} from '../../../sale-points/domain/repositories/sale-points.repository';
import { Ticket } from '../../domain/entities/ticket.entity';
import {
  TICKETS_REPOSITORY,
  type TicketsRepository,
} from '../../domain/repositories/tickets.repository';
import { TicketLine } from '../../domain/value-objects/ticket-line';
import type { CreateTicketApplicationInput } from '../dtos/create-ticket.input';
import { toTicketOutput, type TicketOutput } from '../dtos/ticket.output';
import {
  FOLIO_GENERATOR,
  type FolioGenerator,
} from '../ports/folio-generator.port';

@Injectable()
export class CreateTicket implements UseCase<CreateTicketApplicationInput, TicketOutput> {
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly tickets: TicketsRepository,
    @Inject(GAMES_REPOSITORY) private readonly games: GamesRepository,
    @Inject(SALE_POINTS_REPOSITORY)
    private readonly salePoints: SalePointsRepository,
    @Inject(FOLIO_GENERATOR) private readonly folio: FolioGenerator,
    private readonly resolveNextDraw: ResolveNextDraw,
  ) {}

  async execute(input: CreateTicketApplicationInput): Promise<TicketOutput> {
    const game = await this.games.findById(input.gameId);
    if (!game) throw new NotFoundError('Game', input.gameId);
    if (!game.isActive) {
      throw new ValidationError('Game is not active');
    }

    const salePoint = await this.salePoints.findById(input.salePointId);
    if (!salePoint) throw new NotFoundError('SalePoint', input.salePointId);
    if (!salePoint.isActive) {
      throw new ValidationError('Sale point is not active');
    }
    if (salePoint.ownerId !== input.sellerId) {
      throw new ValidationError('Sale point does not belong to seller');
    }

    const lines = input.lines.map(
      (raw, i) =>
        new TicketLine({
          label: raw.label,
          amount: raw.amount,
          prize: raw.prize,
          subGameId: raw.subGameId ?? null,
          subGameName: raw.subGameName ?? null,
          orderIndex: i,
        }),
    );

    const { drawAt, cutoffMinutes } = await this.resolveNextDraw.execute({
      gameId: input.gameId,
      at: new Date(),
    });

    const ticket = Ticket.create({
      folio: this.folio.generate(),
      gameId: input.gameId,
      salePointId: input.salePointId,
      sellerId: input.sellerId,
      client: this.cleanClient(input.client),
      lines,
      drawAt,
      cutoffMinutes,
    });

    await this.tickets.save(ticket);
    return toTicketOutput(ticket);
  }

  private cleanClient(value: string | null): string | null {
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
}
