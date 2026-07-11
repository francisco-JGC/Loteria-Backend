import type { Ticket } from '../../domain/entities/ticket.entity';
import type { TicketStatus } from '../../domain/value-objects/ticket-status';

export interface TicketLineOutput {
  label: string;
  amount: number;
  prize: number;
  subGameId: string | null;
  subGameName: string | null;
  orderIndex: number;
}

export interface TicketOutput {
  id: string;
  folio: string;
  gameId: string;
  salePointId: string;
  sellerId: string;
  client: string | null;
  status: TicketStatus;
  voidedAt: Date | null;
  voidedReason: string | null;
  total: number;
  totalPrize: number;
  count: number;
  drawAt: Date;
  cutoffMinutes: number;
  paidAt: Date | null;
  paidById: string | null;
  paidPrize: number;
  lines: TicketLineOutput[];
  createdAt: Date;
  updatedAt: Date;
}

export const toTicketOutput = (ticket: Ticket): TicketOutput => ({
  id: ticket.id,
  folio: ticket.folio,
  gameId: ticket.gameId,
  salePointId: ticket.salePointId,
  sellerId: ticket.sellerId,
  client: ticket.client,
  status: ticket.status,
  voidedAt: ticket.voidedAt,
  voidedReason: ticket.voidedReason,
  total: ticket.total,
  totalPrize: ticket.totalPrize,
  count: ticket.count,
  drawAt: ticket.drawAt,
  cutoffMinutes: ticket.cutoffMinutes,
  paidAt: ticket.paidAt,
  paidById: ticket.paidById,
  paidPrize: ticket.paidPrize,
  lines: ticket.lines.map((line) => ({
    label: line.label,
    amount: line.amount,
    prize: line.prize,
    subGameId: line.subGameId,
    subGameName: line.subGameName,
    orderIndex: line.orderIndex,
  })),
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});
