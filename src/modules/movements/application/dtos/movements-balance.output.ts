/**
 * Cash balance per sucursal combining ticket flow (sales - prizes) with
 * manually-registered movements (expenses, deposits, withdrawals). All
 * amounts in centavos.
 *
 * Formula:
 *   net = billed - paidPrize + deposits - withdrawals - expenses
 */
export interface MovementsBalanceRow {
  salePointId: string;
  salePointName: string;
  ownerPartnerId: string | null;
  ownerPartnerName: string | null;
  /** Sum of `tickets.total` for `valid` tickets. */
  billed: number;
  /** Sum of `tickets.paid_prize` for tickets marked as paid. */
  paidPrize: number;
  /** Sum of `movements.amount` where type='deposit'. */
  deposits: number;
  /** Sum of `movements.amount` where type='withdrawal'. */
  withdrawals: number;
  /** Sum of `movements.amount` where type='expense'. */
  expenses: number;
  /** Final cash balance for the range. */
  net: number;
}

export interface MovementsBalanceOutput {
  items: MovementsBalanceRow[];
}
