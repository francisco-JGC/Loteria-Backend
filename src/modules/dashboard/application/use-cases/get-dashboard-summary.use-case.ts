import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import type { UseCase } from '../../../../shared/application/use-case';
import { UserRole } from '../../../users/domain/value-objects/user-role';
import { ListWinningTickets } from '../../../tickets/application/use-cases/list-winning-tickets.use-case';
import type {
  DashboardSummaryOutput,
  DrawStatus,
  RankingItem,
  TodayDrawItem,
} from '../dtos/dashboard-summary.output';

const MONTHS_IN_SERIES = 7;

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

const POST_DRAW_GRACE_MINUTES = 3;

/**
 * Wall-clock timezone the operators live in. `draw_schedules.draw_time`
 * is a plain "HH:MM" string interpreted in this zone (matching what the
 * mobile app does when building schedule DateTimes). The DB may be in any
 * timezone, so we anchor explicitly.
 */
const BUSINESS_TZ = 'America/Managua';

/**
 * Aggregates the numbers powering the home dashboard.
 *
 * Everything is computed on the server: KPIs vs yesterday, monthly series,
 * per-game breakdown, today's draws with their live status, pending payouts
 * and rankings of sellers/sale points.
 */
@Injectable()
export class GetDashboardSummary
  implements UseCase<void, DashboardSummaryOutput>
{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly listWinningTickets: ListWinningTickets,
  ) {}

  async execute(): Promise<DashboardSummaryOutput> {
    const [
      kpis,
      monthlySeries,
      byGame,
      todayDraws,
      pendingPayouts,
      topSellers,
      topSalePoints,
    ] = await Promise.all([
      this.loadKpis(),
      this.loadMonthlySeries(),
      this.loadGameBreakdown(),
      this.loadTodayDraws(),
      this.loadPendingPayouts(),
      this.loadTopSellers(),
      this.loadTopSalePoints(),
    ]);
    return {
      ...kpis,
      monthlySeries,
      byGame,
      todayDraws,
      pendingPayouts,
      topSellers,
      topSalePoints,
    };
  }

  // --- KPIs -----------------------------------------------------------------

  private async loadKpis(): Promise<
    Omit<
      DashboardSummaryOutput,
      | 'monthlySeries'
      | 'byGame'
      | 'todayDraws'
      | 'pendingPayouts'
      | 'topSellers'
      | 'topSalePoints'
    >
  > {
    const rows = await this.dataSource.query<
      Array<{
        billed_today: string;
        paid_today: string;
        tickets_today: string;
        billed_yesterday: string;
        paid_yesterday: string;
        tickets_yesterday: string;
        weekly_billed: string;
        weekly_billed_prev: string;
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
          WHEN t.status = 'valid' AND t.created_at::date = CURRENT_DATE
          THEN 1 ELSE 0 END), 0)::bigint AS tickets_today,

        COALESCE(SUM(CASE
          WHEN t.status = 'valid'
           AND t.created_at::date = CURRENT_DATE - INTERVAL '1 day'
          THEN t.total ELSE 0 END), 0)::bigint AS billed_yesterday,
        COALESCE(SUM(CASE
          WHEN t.paid_at IS NOT NULL
           AND t.paid_at::date = CURRENT_DATE - INTERVAL '1 day'
          THEN t.paid_prize ELSE 0 END), 0)::bigint AS paid_yesterday,
        COALESCE(SUM(CASE
          WHEN t.status = 'valid'
           AND t.created_at::date = CURRENT_DATE - INTERVAL '1 day'
          THEN 1 ELSE 0 END), 0)::bigint AS tickets_yesterday,

        COALESCE(SUM(CASE
          WHEN t.status = 'valid'
           AND t.created_at >= (CURRENT_DATE - INTERVAL '6 days')
          THEN t.total ELSE 0 END), 0)::bigint AS weekly_billed,
        COALESCE(SUM(CASE
          WHEN t.status = 'valid'
           AND t.created_at >= (CURRENT_DATE - INTERVAL '13 days')
           AND t.created_at <  (CURRENT_DATE - INTERVAL '6 days')
          THEN t.total ELSE 0 END), 0)::bigint AS weekly_billed_prev,

        (SELECT COUNT(*) FROM users)::bigint AS total_users
      FROM tickets t
      `,
    );
    const row = rows[0];
    const billedToday = Number(row?.billed_today ?? 0);
    const paidToday = Number(row?.paid_today ?? 0);
    const ticketsToday = Number(row?.tickets_today ?? 0);
    const billedYesterday = Number(row?.billed_yesterday ?? 0);
    const paidYesterday = Number(row?.paid_yesterday ?? 0);
    const ticketsYesterday = Number(row?.tickets_yesterday ?? 0);
    return {
      billedToday,
      paidToday,
      profitToday: billedToday - paidToday,
      ticketsToday,
      averageTicketToday: ticketsToday === 0 ? 0 : Math.round(billedToday / ticketsToday),
      billedYesterday,
      paidYesterday,
      profitYesterday: billedYesterday - paidYesterday,
      ticketsYesterday,
      weeklyBilled: Number(row?.weekly_billed ?? 0),
      weeklyBilledPrev: Number(row?.weekly_billed_prev ?? 0),
      totalUsers: Number(row?.total_users ?? 0),
    };
  }

  // --- Monthly series -------------------------------------------------------

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

  // --- By game --------------------------------------------------------------

  private async loadGameBreakdown(): Promise<
    DashboardSummaryOutput['byGame']
  > {
    const rows = await this.dataSource.query<
      Array<{ id: string; name: string; billed: string; paid: string }>
    >(
      `
      SELECT
        g.id,
        g.name,
        COALESCE(SUM(CASE
          WHEN t.status = 'valid'
           AND t.created_at >= (CURRENT_DATE - INTERVAL '6 days')
          THEN t.total ELSE 0 END), 0)::bigint AS billed,
        COALESCE(SUM(CASE
          WHEN t.paid_at IS NOT NULL
           AND t.paid_at >= (CURRENT_DATE - INTERVAL '6 days')
          THEN t.paid_prize ELSE 0 END), 0)::bigint AS paid
      FROM games g
      LEFT JOIN tickets t ON t.game_id = g.id
      GROUP BY g.id, g.name, g.order_index
      ORDER BY g.order_index ASC
      `,
    );
    return rows.map((r) => ({
      gameId: r.id,
      gameName: r.name,
      billed: Number(r.billed),
      paid: Number(r.paid),
    }));
  }

  // --- Today draws ----------------------------------------------------------

  private async loadTodayDraws(): Promise<TodayDrawItem[]> {
    // Everything runs in wall-clock time relative to BUSINESS_TZ so the DB's
    // own timezone (UTC in prod, local in dev) can never distort the display.
    // Schedules store "HH:MM" as-is; results are converted from timestamptz
    // to Managua wall-clock and matched by string.
    const rows = await this.dataSource.query<
      Array<{
        game_id: string;
        game_name: string;
        draw_time: string;
        cutoff_minutes: number;
        winning_number: string | null;
        now_minutes: string;
      }>
    >(
      `
      WITH biz AS (
        SELECT
          (now() AT TIME ZONE $1)::date AS today,
          EXTRACT(DOW FROM (now() AT TIME ZONE $1))::int AS dow_pg,
          (EXTRACT(HOUR FROM (now() AT TIME ZONE $1)) * 60
            + EXTRACT(MINUTE FROM (now() AT TIME ZONE $1)))::int AS now_minutes
      ),
      today_schedules AS (
        SELECT
          g.id AS game_id,
          g.name AS game_name,
          g.order_index,
          s.cutoff_minutes,
          s.draw_time
        FROM draw_schedules s
        JOIN games g ON g.id = s.game_id
        CROSS JOIN biz
        WHERE s.is_active
          AND g.is_active
          AND (s.day_of_week IS NULL OR s.day_of_week = biz.dow_pg)
      ),
      today_results AS (
        SELECT
          dr.game_id,
          to_char(dr.draw_at AT TIME ZONE $1, 'HH24:MI') AS draw_time,
          dr.winning_number
        FROM draw_results dr
        CROSS JOIN biz
        WHERE (dr.draw_at AT TIME ZONE $1)::date = biz.today
      )
      SELECT
        ts.game_id,
        ts.game_name,
        ts.draw_time,
        ts.cutoff_minutes,
        tr.winning_number,
        biz.now_minutes::text AS now_minutes
      FROM today_schedules ts
      CROSS JOIN biz
      LEFT JOIN today_results tr
        ON tr.game_id = ts.game_id AND tr.draw_time = ts.draw_time
      ORDER BY ts.draw_time ASC, ts.order_index ASC
      `,
      [BUSINESS_TZ],
    );

    return rows.map((r) => ({
      gameId: r.game_id,
      gameName: r.game_name,
      drawTime: r.draw_time,
      status: this.computeDrawStatus(
        r.draw_time,
        r.cutoff_minutes,
        r.winning_number,
        Number(r.now_minutes),
      ),
      winningNumber: r.winning_number,
      cutoffMinutes: r.cutoff_minutes,
    }));
  }

  private computeDrawStatus(
    drawTime: string,
    cutoffMinutes: number,
    winningNumber: string | null,
    nowMinutes: number,
  ): DrawStatus {
    if (winningNumber !== null) return 'settled';
    const [hh, mm] = drawTime.split(':').map((n) => Number(n));
    const drawMinutes = hh * 60 + mm;
    const cutoffAtMin = drawMinutes - cutoffMinutes;
    const graceEndsMin = drawMinutes + POST_DRAW_GRACE_MINUTES;
    if (nowMinutes < cutoffAtMin) return 'upcoming';
    if (nowMinutes <= graceEndsMin) return 'in_progress';
    return 'result_pending';
  }

  // --- Pending payouts ------------------------------------------------------

  private async loadPendingPayouts(): Promise<
    DashboardSummaryOutput['pendingPayouts']
  > {
    // Reuse the shared evaluator so the matching rules stay in a single
    // place — no duplicated three_digit "F" logic in SQL.
    const winners = await this.listWinningTickets.execute({
      requesterId: '',
      requesterRole: UserRole.ADMIN,
      from: new Date(Date.now() - 30 * 24 * 60 * 60_000),
      to: new Date(),
    });
    let count = 0;
    let total = 0;
    for (const w of winners) {
      if (w.ticket.paidAt === null) {
        count += 1;
        total += w.totalPrize;
      }
    }
    return { count, totalAmount: total };
  }

  // --- Top sellers / sale points --------------------------------------------

  private async loadTopSellers(): Promise<RankingItem[]> {
    const rows = await this.dataSource.query<
      Array<{ id: string; name: string; amount: string; ticket_count: string }>
    >(
      `
      SELECT
        u.id,
        u.name,
        COALESCE(SUM(t.total), 0)::bigint AS amount,
        COUNT(t.id)::bigint AS ticket_count
      FROM users u
      LEFT JOIN tickets t
        ON t.seller_id = u.id
       AND t.status = 'valid'
       AND t.created_at::date = CURRENT_DATE
      WHERE u.role = 'seller'
      GROUP BY u.id, u.name
      HAVING COALESCE(SUM(t.total), 0) > 0
      ORDER BY amount DESC
      LIMIT 5
      `,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      ticketCount: Number(r.ticket_count),
    }));
  }

  private async loadTopSalePoints(): Promise<RankingItem[]> {
    const rows = await this.dataSource.query<
      Array<{ id: string; name: string; amount: string; ticket_count: string }>
    >(
      `
      SELECT
        sp.id,
        sp.name,
        COALESCE(SUM(t.total), 0)::bigint AS amount,
        COUNT(t.id)::bigint AS ticket_count
      FROM sale_points sp
      LEFT JOIN tickets t
        ON t.sale_point_id = sp.id
       AND t.status = 'valid'
       AND t.created_at::date = CURRENT_DATE
      GROUP BY sp.id, sp.name
      HAVING COALESCE(SUM(t.total), 0) > 0
      ORDER BY amount DESC
      LIMIT 5
      `,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      ticketCount: Number(r.ticket_count),
    }));
  }

  // --- Helpers --------------------------------------------------------------

  private formatMonthStart(d: Date): string {
    const y = d.getUTCFullYear();
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}-01`;
  }
}
