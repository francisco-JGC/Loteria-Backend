import { randomUUID } from 'crypto';

import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { ValidationError } from '../../../../shared/domain/errors/domain.error';
import { TicketLine } from '../value-objects/ticket-line';
import { TicketStatus } from '../value-objects/ticket-status';

export interface TicketProps {
  folio: string;
  gameId: string;
  salePointId: string;
  sellerId: string;
  client: string | null;
  lines: TicketLine[];
  status: TicketStatus;
  voidedAt: Date | null;
  voidedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTicketInput {
  folio: string;
  gameId: string;
  salePointId: string;
  sellerId: string;
  client: string | null;
  lines: TicketLine[];
}

export class Ticket extends AggregateRoot<TicketProps> {
  private constructor(id: string, props: TicketProps) {
    super(id, props);
  }

  static create(input: CreateTicketInput): Ticket {
    if (input.lines.length === 0) {
      throw new ValidationError('Ticket must have at least one line');
    }
    const now = new Date();
    return new Ticket(randomUUID(), {
      folio: input.folio,
      gameId: input.gameId,
      salePointId: input.salePointId,
      sellerId: input.sellerId,
      client: input.client,
      lines: [...input.lines],
      status: TicketStatus.VALID,
      voidedAt: null,
      voidedReason: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(id: string, props: TicketProps): Ticket {
    return new Ticket(id, props);
  }

  get folio(): string {
    return this.props.folio;
  }

  get gameId(): string {
    return this.props.gameId;
  }

  get salePointId(): string {
    return this.props.salePointId;
  }

  get sellerId(): string {
    return this.props.sellerId;
  }

  get client(): string | null {
    return this.props.client;
  }

  get lines(): ReadonlyArray<TicketLine> {
    return this.props.lines;
  }

  get status(): TicketStatus {
    return this.props.status;
  }

  get voidedAt(): Date | null {
    return this.props.voidedAt;
  }

  get voidedReason(): string | null {
    return this.props.voidedReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get total(): number {
    return this.props.lines.reduce((sum, line) => sum + line.amount, 0);
  }

  get totalPrize(): number {
    return this.props.lines.reduce((sum, line) => sum + line.prize, 0);
  }

  get count(): number {
    return this.props.lines.length;
  }

  get isVoided(): boolean {
    return this.props.status === TicketStatus.VOIDED;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.sellerId === userId;
  }

  minutesSinceCreation(now: Date): number {
    return (now.getTime() - this.props.createdAt.getTime()) / 60_000;
  }

  void(reason: string): void {
    if (this.props.status === TicketStatus.VOIDED) {
      throw new ValidationError('Ticket already voided');
    }
    this.props.status = TicketStatus.VOIDED;
    this.props.voidedAt = new Date();
    this.props.voidedReason = reason;
    this.props.updatedAt = this.props.voidedAt;
  }
}
