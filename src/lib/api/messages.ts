import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, max, sql } from "drizzle-orm";
import { z } from "zod";
import { resolveTutorModelName } from "@/lib/ai/resolve-model";
import { ensureSession } from "@/lib/auth.functions";
import { db } from "@/lib/db";
import { type MessagesSelect, messages } from "@/lib/db/schema";
import {
  normalizeAnnotationMode,
  normalizeStoredFeedback,
} from "@/lib/feedback/annotations";

/**
 * Creates a new message with feedback in the database.
 * @param messageData - The data for the new message with Feedback.
 * @returns A Promise that resolves to the added message data.
 * @throws {Error} If there's a database error.
 */
export const addMessage = createServerFn({ method: "POST" })
  .validator((messageData: Partial<MessagesSelect>) => {
    if (!messageData) {
      throw new Error("Invalid message data");
    }

    if (messageData.modelName) {
      if (process.env.MODE === "prod") {
        // drop model if we are in production, setting this is only valid in dev
        // changing to default
        console.warn(
          `Tried to add message with custom model prod mode - Message Data: ${JSON.stringify(messageData)}`,
        );
        messageData.modelName = undefined;
      }
    }

    return messageData;
  })
  .handler(async ({ data }: { data: Partial<MessagesSelect> }) => {
    data.modelName =
      data.modelName ??
      (data.promptName
        ? await resolveTutorModelName(data.promptName)
        : undefined);

    try {
      const [newMessage] = await db
        .insert(messages)
        .values(data as MessagesSelect)
        .returning();
      return {
        ...newMessage,
        feedback:
          typeof newMessage.feedback === "object" &&
          newMessage.feedback !== null
            ? newMessage.feedback
            : {},
      };
    } catch (error) {
      console.error("Error creating message:", error);
      throw new Error("Failed to create message");
    }
  });

export const getMessages = createServerFn({ method: "POST" })
  .validator((key: string) => {
    if (!key) {
      throw new Error("Key is missing");
    }

    return { key };
  })
  .handler(async ({ data }: { data: { key: string } }) => {
    if (
      !process.env.DATA_EXPORT_KEY ||
      data.key !== process.env.DATA_EXPORT_KEY
    ) {
      throw new Error("Key invalid");
    }

    try {
      const data = await db.select().from(messages);
      const mapped = data.map((msg) => ({
        ...msg,
        feedback:
          typeof msg.feedback === "object" && msg.feedback !== null
            ? msg.feedback
            : {},
      }));
      return mapped;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("Failed to fetch data");
    }
  });

async function ensureOwnTutor(tutorId: string) {
  const session = await ensureSession();
  const tutor = await db.query.tutors.findFirst({
    columns: { tutorId: true },
    where(fields, { and, eq }) {
      return and(
        eq(fields.tutorId, tutorId),
        eq(fields.userId, session.user.id),
      );
    },
  });

  if (!tutor) {
    throw new Error(`Tutor ${tutorId} could not be loaded`);
  }
}

export const getOwnTutorConversations = createServerFn({ method: "GET" })
  .validator(z.object({ tutorId: z.string().min(1) }))
  .handler(async ({ data: { tutorId } }) => {
    await ensureOwnTutor(tutorId);

    try {
      return await db
        .select({
          executionId: messages.executionId,
          pseudonym: sql<string>`max(${messages.pseudonym})`,
          messageCount: count(),
          // t_messages.createdAt is a timestamp without timezone and stores UTC wall time.
          lastMessageAt: sql<Date>`max(${messages.createdAt}) AT TIME ZONE 'UTC'`,
        })
        .from(messages)
        .where(eq(messages.promptName, tutorId))
        .groupBy(messages.executionId)
        .orderBy(desc(max(messages.createdAt)));
    } catch {
      throw new Error(`Conversations for tutor ${tutorId} could not be loaded`);
    }
  });

export const getOwnTutorConversation = createServerFn({ method: "GET" })
  .validator(
    z.object({
      tutorId: z.string().min(1),
      executionId: z.string().min(1),
    }),
  )
  .handler(async ({ data: { tutorId, executionId } }) => {
    await ensureOwnTutor(tutorId);

    try {
      const conversation = await db
        .select({
          id: messages.id,
          executionId: messages.executionId,
          createdAt: sql<Date>`${messages.createdAt} AT TIME ZONE 'UTC'`,
          pseudonym: messages.pseudonym,
          role: messages.role,
          message: messages.message,
          feedback: messages.feedback,
          mode: messages.mode,
        })
        .from(messages)
        .where(
          and(
            eq(messages.promptName, tutorId),
            eq(messages.executionId, executionId),
          ),
        )
        .orderBy(asc(messages.createdAt), asc(messages.id));

      return conversation.map((message) => ({
        ...message,
        feedback: normalizeStoredFeedback(message.feedback),
        mode: normalizeAnnotationMode(message.mode),
      }));
    } catch {
      throw new Error(`Conversation ${executionId} could not be loaded`);
    }
  });

export const getOwnTutorMessages = createServerFn({ method: "GET" })
  .validator(z.object({ tutorId: z.string().min(1) }))
  .handler(async ({ data: { tutorId } }) => {
    await ensureOwnTutor(tutorId);

    try {
      const tutorMessages = await db
        .select({
          id: messages.id,
          executionId: messages.executionId,
          pseudonym: messages.pseudonym,
          createdAt: sql<Date>`${messages.createdAt} AT TIME ZONE 'UTC'`,
          role: messages.role,
          message: messages.message,
          feedback: messages.feedback,
          mode: messages.mode,
        })
        .from(messages)
        .where(eq(messages.promptName, tutorId))
        .orderBy(asc(messages.createdAt), asc(messages.id));

      return tutorMessages.map((message) => ({
        ...message,
        feedback: normalizeStoredFeedback(message.feedback),
        mode: normalizeAnnotationMode(message.mode),
      }));
    } catch {
      throw new Error(`Messages for tutor ${tutorId} could not be loaded`);
    }
  });
