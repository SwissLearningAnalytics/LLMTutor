import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, max, sql } from "drizzle-orm";
import { z } from "zod";
import { resolveTutorModelName } from "@/lib/ai/resolve-model";
import { ensureSession } from "@/lib/auth.functions";
import { db } from "@/lib/db";
import { messages, tutorSessions } from "@/lib/db/schema";
import {
  normalizeAnnotationMode,
  normalizeStoredFeedback,
} from "@/lib/feedback/annotations";
import { annotationScaleSchema } from "@/lib/feedback/types";
import {
  getResumableSince,
  verifyTutorSession,
} from "@/lib/tutor-session-auth";

const storedAnnotationsSchema = z.record(
  z.string(),
  z.object({
    question: z.string(),
    scale: annotationScaleSchema,
    value: z.string(),
  }),
);

/**
 * Stores the answer of a student with the reflection on the tutor's previous message.
 * The pseudonym and annotation mode are taken from the session, not from the browser.
 * @throws {Error} If the token does not match the session, or there's a database error.
 */
export const addUserMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tutorId: z.string().min(1),
      executionId: z.string().min(1),
      token: z.string().min(1),
      model: z.string().optional(),
      message: z.string().min(1),
      feedback: storedAnnotationsSchema,
    }),
  )
  .handler(async ({ data }) => {
    const session = await verifyTutorSession({ ...data, touch: true });

    // setting the model is only valid in dev
    const modelName =
      (process.env.MODE !== "prod" && data.model) ||
      (await resolveTutorModelName(data.tutorId));

    try {
      await db.insert(messages).values({
        executionId: data.executionId,
        pseudonym: session.pseudonym,
        promptName: data.tutorId,
        modelName,
        role: "user",
        message: data.message,
        feedback: data.feedback,
        mode: session.mode,
      });
    } catch (error) {
      console.error("Error creating message:", error);
      throw new Error("Failed to create message");
    }
  });

/**
 * Stores the reflection on the student's own answer with the tutor's reply to it.
 * The reply itself is stored by the chat route.
 */
export const saveReflectionOnOwnAnswer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tutorId: z.string().min(1),
      executionId: z.string().min(1),
      token: z.string().min(1),
      feedback: storedAnnotationsSchema,
    }),
  )
  .handler(async ({ data }) => {
    await verifyTutorSession({ ...data, touch: true });

    const [latestMessage] = await db
      .select({ id: messages.id, role: messages.role })
      .from(messages)
      .where(
        and(
          eq(messages.promptName, data.tutorId),
          eq(messages.executionId, data.executionId),
        ),
      )
      .orderBy(desc(messages.id))
      .limit(1);

    if (latestMessage?.role !== "ai") {
      throw new Error(
        `Execution ${data.executionId} has no reply to reflect on`,
      );
    }

    await db
      .update(messages)
      .set({ feedback: data.feedback })
      .where(eq(messages.id, latestMessage.id));
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
          // sessions started before resuming was possible have no token, they can't be resumed
          isResumable: sql<boolean>`coalesce(bool_or(${tutorSessions.lastActiveAt} > ${getResumableSince()}), false)`,
        })
        .from(messages)
        .leftJoin(
          tutorSessions,
          eq(tutorSessions.executionId, messages.executionId),
        )
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
