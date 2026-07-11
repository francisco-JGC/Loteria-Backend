import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../../../../auth/infrastructure/http/decorators/current-user.decorator';
import type { RequestUser } from '../../../../auth/infrastructure/strategies/jwt.strategy';
import { CreateTicket } from '../../../application/use-cases/create-ticket.use-case';
import { FindTicketByFolio } from '../../../application/use-cases/find-ticket-by-folio.use-case';
import { FindTicketById } from '../../../application/use-cases/find-ticket-by-id.use-case';
import { ListTickets } from '../../../application/use-cases/list-tickets.use-case';
import type { ListTicketsOutput } from '../../../application/use-cases/list-tickets.use-case';
import { VoidTicket } from '../../../application/use-cases/void-ticket.use-case';
import type { TicketOutput } from '../../../application/dtos/ticket.output';
import { CreateTicketHttpDto } from '../dtos/create-ticket-http.dto';
import { ListTicketsQueryDto } from '../dtos/list-tickets-query.dto';
import { VoidTicketHttpDto } from '../dtos/void-ticket-http.dto';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly createTicket: CreateTicket,
    private readonly listTickets: ListTickets,
    private readonly findTicketById: FindTicketById,
    private readonly findTicketByFolio: FindTicketByFolio,
    private readonly voidTicketUseCase: VoidTicket,
  ) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateTicketHttpDto,
  ): Promise<TicketOutput> {
    return this.createTicket.execute({
      gameId: dto.gameId,
      salePointId: dto.salePointId,
      sellerId: user.id,
      client: dto.client ?? null,
      lines: dto.lines,
    });
  }

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListTicketsQueryDto,
  ): Promise<ListTicketsOutput> {
    return this.listTickets.execute({
      requesterId: user.id,
      requesterRole: user.role,
      salePointId: query.salePointId,
      gameId: query.gameId,
      sellerId: query.sellerId,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('folio/:folio')
  findByFolio(
    @CurrentUser() user: RequestUser,
    @Param('folio') folio: string,
  ): Promise<TicketOutput> {
    return this.findTicketByFolio.execute({
      folio,
      requesterId: user.id,
      requesterRole: user.role,
    });
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TicketOutput> {
    return this.findTicketById.execute({
      id,
      requesterId: user.id,
      requesterRole: user.role,
    });
  }

  @Post(':id/void')
  voidTicket(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VoidTicketHttpDto,
  ): Promise<TicketOutput> {
    return this.voidTicketUseCase.execute({
      id,
      reason: dto.reason,
      requesterId: user.id,
      requesterRole: user.role,
    });
  }
}
