import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, botLogsTable } from "@workspace/db";
import { GetStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      totalLogs: sql<number>`cast(count(*) as int)`,
      successCount: sql<number>`cast(count(*) filter (where ${botLogsTable.status} = 'success') as int)`,
      failedCount: sql<number>`cast(count(*) filter (where ${botLogsTable.status} = 'failed') as int)`,
      skippedCount: sql<number>`cast(count(*) filter (where ${botLogsTable.status} = 'skipped') as int)`,
      todayCount: sql<number>`cast(count(*) filter (where ${botLogsTable.createdAt} >= current_date) as int)`,
    })
    .from(botLogsTable);

  const row = rows[0] ?? {
    totalLogs: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    todayCount: 0,
  };

  const attempted = row.successCount + row.failedCount;
  const bypassSuccessRate = attempted > 0 ? (row.successCount / attempted) * 100 : 0;

  res.json(
    GetStatsResponse.parse({
      totalLogs: row.totalLogs,
      successCount: row.successCount,
      failedCount: row.failedCount,
      skippedCount: row.skippedCount,
      todayCount: row.todayCount,
      bypassSuccessRate: Math.round(bypassSuccessRate * 10) / 10,
    }),
  );
});

export default router;
