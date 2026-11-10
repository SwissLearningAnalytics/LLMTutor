import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "@/lib/auth-schema";
import { defaultAnnotationConfig } from "@/lib/feedback/annotations";
import type { AnnotationConfig } from "@/lib/feedback/types";

export * from "@/lib/auth-schema";

export const messages = pgTable("t_messages", {
  id: serial("pk_message_id").primaryKey(),
  executionId: varchar("executionId", { length: 64 }).notNull(),
  pseudonym: varchar("pseudonym", { length: 64 }).notNull(),
  promptName: text("promptName")
    .notNull()
    .references(() => tutors.tutorId, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  modelName: varchar("modelName", { length: 64 }).notNull(),
  role: varchar("role", { enum: ["ai", "user"], length: 10 }).notNull(),
  message: text("message").notNull(),
  feedback: json("feedback").notNull(), // leaving this unstructured (or less stuctured) on purpose
  mode: text("mode"), // annotation mode of the tutor at the time of the message, "study" | "non-study" for old messages
  createdAt: timestamp().defaultNow().notNull(),
});

export const aiModels = pgTable(
  "t_ai_models",
  {
    id: serial("pk_ai_model_id").primaryKey(),
    name: varchar({ length: 64 }).notNull().unique(), // model id as passed to the ai provider, e.g. gpt-5.4
    label: text(),
    isDefault: boolean("is_default").default(false).notNull(),
  },
  (table) => [
    // at most one default model
    uniqueIndex("t_ai_models_single_default")
      .on(table.isDefault)
      .where(sql`${table.isDefault}`),
  ],
);

export const tutors = pgTable("t_tutors", {
  id: serial("pk_tutor_id").primaryKey(),
  tutorId: text("tutor_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  prompt: text().notNull(),
  learningObjectives: text("learning_objectives"),
  published: boolean().default(false).notNull(),
  codeExecutionEnabled: boolean("code_execution_enabled")
    .default(false)
    .notNull(),
  // null means the tutor uses the default model
  modelId: integer("model_id").references(() => aiModels.id, {
    onDelete: "restrict",
  }),
  annotations: json("annotations")
    .$type<AnnotationConfig>()
    .default(defaultAnnotationConfig)
    .notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const tutorsRelations = relations(tutors, ({ one }) => ({
  user: one(user, {
    fields: [tutors.userId],
    references: [user.id],
  }),
  model: one(aiModels, {
    fields: [tutors.modelId],
    references: [aiModels.id],
  }),
}));

export const aiModelsRelations = relations(aiModels, ({ many }) => ({
  tutors: many(tutors),
}));

export type MessagesSelect = typeof messages.$inferSelect;
export type TutorSelect = typeof tutors.$inferSelect;
export type TutorInsert = typeof tutors.$inferInsert;
export type AiModelSelect = typeof aiModels.$inferSelect;
