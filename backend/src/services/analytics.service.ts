import { prisma } from "../config/database";

export class AnalyticsService {
  async recordView(path: string) {
    return prisma.pageView.create({ data: { path } });
  }

  async getTrafficStats() {
    const now = new Date();

    // Last 30 days range
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [daily, hourly] = await Promise.all([
      // Visits grouped by day (last 30 days)
      prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT
          TO_CHAR(created_at AT TIME ZONE 'America/Santo_Domingo', 'YYYY-MM-DD') AS day,
          COUNT(*) AS count
        FROM page_views
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY day
        ORDER BY day ASC
      `,
      // Visits grouped by hour of day (all time)
      prisma.$queryRaw<{ hour: number; count: bigint }[]>`
        SELECT
          EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Santo_Domingo')::int AS hour,
          COUNT(*) AS count
        FROM page_views
        GROUP BY hour
        ORDER BY hour ASC
      `,
    ]);

    // Fill in missing days with 0
    const dailyMap: Record<string, number> = {};
    for (const row of daily) {
      dailyMap[row.day] = Number(row.count);
    }
    const dailyFilled: { day: string; visits: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyFilled.push({ day: key, visits: dailyMap[key] ?? 0 });
    }

    // Fill in missing hours with 0
    const hourlyMap: Record<number, number> = {};
    for (const row of hourly) {
      hourlyMap[Number(row.hour)] = Number(row.count);
    }
    const hourlyFilled = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      visits: hourlyMap[h] ?? 0,
    }));

    return { daily: dailyFilled, hourly: hourlyFilled };
  }
}

export const analyticsService = new AnalyticsService();
