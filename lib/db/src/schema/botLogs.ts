import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botLogsTable = pgTable("bot_logs", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  level: text("level").notNull().default("info"),
  message: text("message"),
  originalUrl: text("original_url").notNull(),
  bypassedUrl: text("bypassed_url"),
  finalUrl: text("final_url"),
  status: text("status").notNull().default("success"),
  hadMedia: boolean("had_media").notNull().default(false),
});

export const insertBotLogSchema = createInsertSchema(botLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBotLog = z.infer<typeof insertBotLogSchema>;
export type BotLog = typeof botLogsTable.$inferSelect;
