/**
 * Aggregated totals for a set of tickets. Every amount is in centavos
 * (integer), same units as `tickets.total` / `tickets.paid_prize`.
 */
export interface TicketsSummaryOutput {
  /** Number of `valid` tickets in the range (not counting voided). */
  ticketCount: number;
  /** Number of tickets marked as voided in the range. */
  voidedCount: number;
  /** Number of tickets whose prize has been paid out. */
  paidCount: number;
  /** Sum of `tickets.total` for `valid` tickets — i.e., collected billing. */
  billed: number;
  /** Sum of `tickets.paid_prize` for tickets marked as paid. */
  paidPrize: number;
  /**
   * Seller commission: `billed * paymentPercentage / 100`, rounded. Only
   * present when the query is scoped to a single seller and that user has
   * a `paymentPercentage` configured; otherwise `null`.
   */
  salary: number | null;
  /** The rate that produced `salary`. Null when `salary` is null. */
  paymentPercentage: number | null;
}
