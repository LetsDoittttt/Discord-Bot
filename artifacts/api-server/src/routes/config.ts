import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, botConfigTable } from "@workspace/db";
import { UpdateConfigBody, GetConfigResponse, UpdateConfigResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureConfig() {
  const existing = await db.select().from(botConfigTable).where(eq(botConfigTable.id, 1));
  if (existing.length === 0) {
    await db.insert(botConfigTable).values({ id: 1 });
  }
  const rows = await db.select().from(botConfigTable).where(eq(botConfigTable.id, 1));
  return rows[0]!;
}

router.get("/config", async (_req, res): Promise<void> => {
  const config = await ensureConfig();
  res.json(
    GetConfigResponse.parse({
      id: config.id,
      sourceChannel: config.sourceChannel,
      admavenEnabled: config.admavenEnabled,
      updatedAt: config.updatedAt.toISOString(),
    }),
  );
});

router.put("/config", async (req, res): Promise<void> => {
  const parsed = UpdateConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await ensureConfig();

  const updates: Partial<typeof botConfigTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.sourceChannel != null) updates.sourceChannel = parsed.data.sourceChannel;
  if (parsed.data.admavenEnabled != null) updates.admavenEnabled = parsed.data.admavenEnabled;

  const [config] = await db
    .update(botConfigTable)
    .set(updates)
    .where(eq(botConfigTable.id, 1))
    .returning();

  res.json(
    UpdateConfigResponse.parse({
      id: config.id,
      sourceChannel: config.sourceChannel,
      admavenEnabled: config.admavenEnabled,
      updatedAt: config.updatedAt.toISOString(),
    }),
  );
});

export default router;
