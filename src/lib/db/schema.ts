import {
  json,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
};

export const messages = pgTable("t_messages", {
  id: serial("pk_message_id").primaryKey(),
  executionId: varchar("executionId", { length: 64 }).notNull(),
  pseudonym: varchar("pseudonym", { length: 64 }).notNull(),
  promptName: varchar("promptName", { length: 64 }).notNull(),
  modelName: varchar("modelName", { length: 64 }).notNull(),
  role: varchar("role", { enum: ["ai", "user"], length: 10 }).notNull(),
  message: text("message").notNull(),
  feedback: json("feedback").notNull(), // leaving this unstructured (or less stuctured) on purpose
  mode: text("mode"),

  ...timestamps,
});

export type MessagesSelect = typeof messages.$inferSelect;
