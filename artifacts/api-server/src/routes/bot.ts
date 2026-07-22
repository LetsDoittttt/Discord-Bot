import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, botStatusTable } from "@workspace/db";
import { PostHeartbeatBody, GetBotStatusResponse, PostHeartbeatResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

function isOnline(lastHeartbeat: Date | null): boolean {
  if (!lastHeartbeat) return false;
  return Date.now() - lastHeartbeat.getTime() < HEARTBEAT_TIMEOUT_MS;
}

router.get("/bot/status", async (_req, res): Promise<void> => {
  const rows = await db.select().from(botStatusTable).where(eq(botStatusTable.id, 1));
  const row = rows[0] ?? null;

  res.json(
    GetBotStatusResponse.parse({
      isRunning: isOnline(row?.lastHeartbeat ?? null),
      lastHeartbeat: row?.lastHeartbeat?.toISOString() ?? null,
      startedAt: row?.startedAt?.toISOString() ?? null,
    }),
  );
});

router.post("/bot/heartbeat", async (req, res): Promise<void> => {
  const parsed = PostHeartbeatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const now = new Date();
  const startedAt = new Date(parsed.data.startedAt);

  await db
    .insert(botStatusTable)
    .values({ id: 1, lastHeartbeat: now, startedAt })
    .onConflictDoUpdate({
      target: botStatusTable.id,
      set: { lastHeartbeat: now, startedAt },
    });

  res.json(
    PostHeartbeatResponse.parse({
      isRunning: true,
      lastHeartbeat: now.toISOString(),
      startedAt: startedAt.toISOString(),
    }),
  );
});

export default router;
