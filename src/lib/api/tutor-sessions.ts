import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { ResumableSession } from "@/lib/ai/tutor-chat";
import { ensureSession } from "@/lib/auth.functions";
import { hasAdminRole } from "@/lib/auth-roles";
import { db } from "@/lib/db";
import { messages, tutorSessions } from "@/lib/db/schema";
import {
  normalizeAnnotationMode,
  normalizeStoredFeedback,
} from "@/lib/feedback/annotations";
import type { AnnotationMode } from "@/lib/feedback/types";
import {
  createSecret,
  getResumableSince,
  hashSecret,
  isSessionExpired,
  RESUME_LINK_VALIDITY_MS,
  verifyTutorSession,
} from "@/lib/tutor-session-auth";

export type TutorSessionCredentials = {
  executionId: string;
  token: string;
};

const sessionCredentialsSchema = z.object({
  tutorId: z.string().min(1),
  executionId: z.string().min(1),
  token: z.string().min(1),
});

/**
 * Starts a new session of a published tutor.
 * @returns The id of the session and the token the browser needs to continue it.
 */
export const startTutorSession = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tutorId: z.string().min(1),
      pseudonym: z.string().trim().min(1).max(64),
    }),
  )
  .handler(
    async ({
      data: { tutorId, pseudonym },
    }): Promise<TutorSessionCredentials & { mode: AnnotationMode }> => {
      const tutor = await db.query.tutors.findFirst({
        columns: { annotations: true },
        where(fields, { and, eq }) {
          return and(eq(fields.tutorId, tutorId), eq(fields.published, true));
        },
      });
      if (!tutor) {
        throw new Error(`Tutor ${tutorId} could not be loaded`);
      }

      const executionId = nanoid(10);
      const token = createSecret();
      const mode = tutor.annotations.mode;
      await db.insert(tutorSessions).values({
        executionId,
        tutorId,
        pseudonym,
        mode,
        tokenHash: await hashSecret(token),
      });

      return { executionId, token, mode };
    },
  );

/**
 * Loads a session to continue it, e.g. after the page was reloaded.
 * POST, so the token does not end up in logs as part of the url.
 */
export const getResumableSession = createServerFn({ method: "POST" })
  .validator(sessionCredentialsSchema)
  .handler(async ({ data }): Promise<ResumableSession> => {
    const session = await verifyTutorSession(data);

    const rows = await db
      .select({
        id: messages.id,
        role: messages.role,
        message: messages.message,
        feedback: messages.feedback,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        and(
          eq(messages.promptName, data.tutorId),
          eq(messages.executionId, data.executionId),
        ),
      )
      .orderBy(asc(messages.createdAt), asc(messages.id));

    return {
      pseudonym: session.pseudonym,
      mode: normalizeAnnotationMode(session.mode),
      // lastActiveAt is updated with every message, also with the user message that is still waiting for a reply
      secondsSinceLastActivity:
        (Date.now() - session.lastActiveAt.getTime()) / 1000,
      messages: rows.map(({ id, role, message, feedback }) => ({
        id,
        role,
        message,
        hasFeedback: Object.keys(normalizeStoredFeedback(feedback)).length > 0,
      })),
    };
  });

/**
 * Creates a single use link to continue a session on another device, e.g. after a browser crashed.
 * Only the owner of the tutor and admins can create one.
 * @returns The code that is put into the fragment of the link.
 */
export const createResumeCode = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tutorId: z.string().min(1),
      executionId: z.string().min(1),
    }),
  )
  .handler(async ({ data: { tutorId, executionId } }) => {
    const authSession = await ensureSession();
    const tutor = await db.query.tutors.findFirst({
      columns: { userId: true },
      where(fields, { eq }) {
        return eq(fields.tutorId, tutorId);
      },
    });
    if (
      !tutor ||
      (tutor.userId !== authSession.user.id && !hasAdminRole(authSession.user))
    ) {
      throw new Error(`Tutor ${tutorId} could not be loaded`);
    }

    const session = await db.query.tutorSessions.findFirst({
      where: and(
        eq(tutorSessions.executionId, executionId),
        eq(tutorSessions.tutorId, tutorId),
      ),
    });
    if (!session || isSessionExpired(session.lastActiveAt)) {
      throw new Error(`Session ${executionId} can not be resumed anymore`);
    }

    const code = createSecret();
    await db
      .update(tutorSessions)
      .set({
        resumeCodeHash: await hashSecret(code),
        resumeCodeExpiresAt: new Date(Date.now() + RESUME_LINK_VALIDITY_MS),
      })
      .where(eq(tutorSessions.executionId, executionId));

    return { code };
  });

/**
 * Exchanges the code of a resume link for a new token. The token of the previous device stops working,
 * so a session is never continued on two devices at once.
 */
export const redeemResumeCode = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tutorId: z.string().min(1),
      code: z.string().min(1),
    }),
  )
  .handler(
    async ({ data: { tutorId, code } }): Promise<TutorSessionCredentials> => {
      const token = createSecret();
      const now = new Date();
      // a single update, so a link that is opened twice at the same time is only redeemed once
      const [session] = await db
        .update(tutorSessions)
        .set({
          tokenHash: await hashSecret(token),
          resumeCodeHash: null,
          resumeCodeExpiresAt: null,
        })
        .where(
          and(
            eq(tutorSessions.tutorId, tutorId),
            eq(tutorSessions.resumeCodeHash, await hashSecret(code)),
            gt(tutorSessions.resumeCodeExpiresAt, now),
            gt(tutorSessions.lastActiveAt, getResumableSince()),
          ),
        )
        .returning({ executionId: tutorSessions.executionId });

      if (!session) {
        throw new Error("Resume link is invalid or expired");
      }

      return { executionId: session.executionId, token };
    },
  );
