/**
 * One row per game: how much was wagered on it and how much was paid out.
 * Amounts in centavos (integer). `share` is a fraction 0..1 that lets the
 * UI render % contribution without recomputing totals.
 */
export interface BillingByGameRow {
  gameId: string;
  gameName: string;
  ticketCount: number;
  voidedCount: number;
  paidCount: number;
  billed: number;
  paidPrize: number;
  net: number;
  /** `billed / totalBilled` — 0 when `totalBilled` is zero. */
  share: number;
}

export interface BillingByGameOutput {
  items: BillingByGameRow[];
}
