import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import type { UseCase } from '../../../../shared/application/use-case';
import type { DashboardSummaryOutput } from '../dtos/dashboard-summary.output';

const MONTHS_IN_SERIES = 7;

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/**
 * Aggregates numbers for the home dashboard in a single roundtrip using
 * database aggregation. Avoids paging thousands of tickets to the client just
 * to sum them.
 */
@Injectable()
export class GetDashboardSummary
  implements UseCase<void, DashboardSummaryOutput>
{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute(): Promise<DashboardSummaryOutput> {
    const [kpis, series] = await Promise.all([
      this.loadKpis(),
      this.loadMonthlySeries(),
    ]);
    return { ...kpis, monthlySeries: series };
  }

  private async loadKpis(): Promise<Omit<DashboardSummaryOutput, 'monthlySeries'>> {
    const rows = await this.dataSource.query<
      Array<{
        billed_today: string;
        paid_today: string;
        weekly_billed: string;
        total_users: string;
      }>
    >(
      `
      SELECT
        COALESCE(SUM(CASE
          WHEN t.status = 'valid' AND t.created_at::date = CURRENT_DATE
          THEN t.total ELSE 0 END), 0)::bigint AS billed_today,
        COALESCE(SUM(CASE
          WHEN t.paid_at IS NOT NULL AND t.paid_at::date = CURRENT_DATE
          THEN t.paid_prize ELSE 0 END), 0)::bigint AS paid_today,
        COALESCE(SUM(CASE
          WHEN t.status = 'valid'
           AND t.created_at >= (CURRENT_DATE - INTERVAL '6 days')
          THEN t.total ELSE 0 END), 0)::bigint AS weekly_billed,
        (SELECT COUNT(*) FROM users)::bigint AS total_users
      FROM tickets t
      `,
    );
    const row = rows[0];
    return {
      billedToday: Number(row?.billed_today ?? 0),
      paidToday: Number(row?.paid_today ?? 0),
      weeklyBilled: Number(row?.weekly_billed ?? 0),
      totalUsers: Number(row?.total_users ?? 0),
    };
  }

  private async loadMonthlySeries(): Promise<
    DashboardSummaryOutput['monthlySeries']
  > {
    const rows = await this.dataSource.query<
      Array<{ month_start: Date; billed: string; paid: string }>
    >(
      `
      WITH months AS (
        SELECT date_trunc('month', now()) - (n || ' months')::interval AS month_start
        FROM generate_series(0, $1 - 1) AS n
      )
      SELECT
        m.month_start,
        COALESCE(SUM(CASE
          WHEN t.status = 'valid'
           AND t.created_at >= m.month_start
           AND t.created_at < m.month_start + INTERVAL '1 month'
          THEN t.total ELSE 0 END), 0)::bigint AS billed,
        COALESCE(SUM(CASE
          WHEN t.paid_at IS NOT NULL
           AND t.paid_at >= m.month_start
           AND t.paid_at < m.month_start + INTERVAL '1 month'
          THEN t.paid_prize ELSE 0 END), 0)::bigint AS paid
      FROM months m
      LEFT JOIN tickets t ON true
      GROUP BY m.month_start
      ORDER BY m.month_start ASC
      `,
      [MONTHS_IN_SERIES],
    );

    return rows.map((r) => {
      // Postgres returns the row as a Date at UTC midnight. Using local
      // getters (getMonth/getFullYear) would drift a full month in negative
      // timezones. Read the month in UTC so the label matches what the SQL
      // computed.
      const date = new Date(r.month_start);
      const label = MONTH_LABELS[date.getUTCMonth()] ?? '';
      return {
        monthStart: this.formatMonthStart(date),
        label,
        billed: Number(r.billed),
        paid: Number(r.paid),
      };
    });
  }

  private formatMonthStart(d: Date): string {
    const y = d.getUTCFullYear();
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}-01`;
  }
}
