import { pgTable, integer, timestamp } from "drizzle-orm/pg-core";

export const botStatusTable = pgTable("bot_status", {
  id: integer("id").primaryKey().default(1),
  lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
});

export type BotStatus = typeof botStatusTable.$inferSelect;
