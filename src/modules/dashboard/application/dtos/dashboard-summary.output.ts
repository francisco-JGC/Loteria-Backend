export interface MonthlySeriesPoint {
  /** ISO first day of the month (YYYY-MM-01). */
  monthStart: string;
  /** Localized month label ("Enero", "Feb", ...). */
  label: string;
  /** Total billed (tickets.total) for that month, excluding voided tickets. */
  billed: number;
  /** Total paid (tickets.paid_prize) for that month. */
  paid: number;
}

export interface DashboardSummaryOutput {
  billedToday: number;
  paidToday: number;
  weeklyBilled: number;
  totalUsers: number;
  monthlySeries: MonthlySeriesPoint[];
}
