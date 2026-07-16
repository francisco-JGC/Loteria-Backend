/**
 * Per-draw aggregate. One row per (game, drawAt) that had at least one
 * ticket in the requested window.
 */
export interface TicketsByDrawItem {
  gameId: string;
  drawAt: string;
  ticketCount: number;
  voidedCount: number;
  paidCount: number;
  billed: number;
  paidPrize: number;
  /** Winning number if the draw already has a registered result. */
  winningNumber: string | null;
}

export type TicketsByDrawOutput = TicketsByDrawItem[];
