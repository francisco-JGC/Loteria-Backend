/**
 * One row per seller: their aggregate totals over the requested date range,
 * plus the computed commission (`salary = billed × paymentPercentage / 100`).
 * Amounts are in centavos (integer), same as `tickets.total`.
 */
export interface SellerReportRow {
  sellerId: string;
  sellerName: string;
  ticketCount: number;
  voidedCount: number;
  paidCount: number;
  billed: number;
  paidPrize: number;
  paymentPercentage: number | null;
  /**
   * `Math.round(billed * paymentPercentage / 100)` when the seller has a
   * configured percentage; `null` otherwise (payroll can't be computed).
   */
  salary: number | null;
}

export interface SellerReportOutput {
  items: SellerReportRow[];
}
