import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, botLogsTable } from "@workspace/db";
import {
  ListLogsQueryParams,
  CreateLogBody,
  CreateLogResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/logs", async (req, res): Promise<void> => {
  const parsed = ListLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 50, offset = 0, status } = parsed.data;

  const whereClause = status ? eq(botLogsTable.status, status) : undefined;

  const [logs, countResult] = await Promise.all([
    db
      .select()
      .from(botLogsTable)
      .where(whereClause)
      .orderBy(desc(botLogsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(botLogsTable)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;

  res.json({
    logs: logs.map((l) => ({
      id: l.id,
      createdAt: l.createdAt.toISOString(),
      level: l.level,
      message: l.message,
      originalUrl: l.originalUrl,
      bypassedUrl: l.bypassedUrl,
      finalUrl: l.finalUrl,
      status: l.status,
      hadMedia: l.hadMedia,
    })),
    total,
  });
});

router.post("/logs", async (req, res): Promise<void> => {
  const parsed = CreateLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { level, message, originalUrl, bypassedUrl, finalUrl, status, hadMedia } = parsed.data;

  const [log] = await db
    .insert(botLogsTable)
    .values({
      level: level ?? "info",
      message: message ?? null,
      originalUrl,
      bypassedUrl: bypassedUrl ?? null,
      finalUrl: finalUrl ?? null,
      status,
      hadMedia: hadMedia ?? false,
    })
    .returning();

  res.status(201).json(
    CreateLogResponse.parse({
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      level: log.level,
      message: log.message,
      originalUrl: log.originalUrl,
      bypassedUrl: log.bypassedUrl,
      finalUrl: log.finalUrl,
      status: log.status,
      hadMedia: log.hadMedia,
    }),
  );
});

export default router;
