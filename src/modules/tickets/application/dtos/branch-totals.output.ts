/**
 * One row per sucursal: aggregate revenue + payouts. All amounts are in
 * centavos (integer). `net = billed - paidPrize` is the amount that stays
 * with the business after paying winners.
 */
export interface BranchTotalsRow {
  salePointId: string;
  salePointName: string;
  ownerPartnerId: string | null;
  ownerPartnerName: string | null;
  ticketCount: number;
  voidedCount: number;
  paidCount: number;
  billed: number;
  paidPrize: number;
  net: number;
}

export interface BranchTotalsOutput {
  items: BranchTotalsRow[];
}
