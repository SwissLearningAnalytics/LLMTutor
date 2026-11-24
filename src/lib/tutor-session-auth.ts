import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tutorSessions } from "@/lib/db/schema";
import {
  SESSION_EXPIRED_ERROR,
  SESSION_REPLACED_ERROR,
} from "@/lib/tutor-session-errors";

export const RESUME_LINK_VALIDITY_MS = 15 * 60 * 1000;

function getResumableSessionMs() {
  const hours = Number(process.env.RESUMABLE_SESSION_HOURS);
  return (Number.isFinite(hours) && hours > 0 ? hours : 4) * 60 * 60 * 1000;
}

export function isSessionExpired(lastActiveAt: Date) {
  return Date.now() - lastActiveAt.getTime() > getResumableSessionMs();
}

export function getResumableSince() {
  return new Date(Date.now() - getResumableSessionMs());
}

export function createSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

export async function hashSecret(secret: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return Buffer.from(digest).toString("hex");
}

/**
 * Checks the token the student's browser got when the session was started or resumed.
 * @param touch - true for writes, the session stays resumable until it was inactive for a while
 * @throws {Error} If the token does not belong to the session, or the session expired.
 */
export async function verifyTutorSession({
  tutorId,
  executionId,
  token,
  touch = false,
}: {
  tutorId: string;
  executionId: string;
  token: string;
  touch?: boolean;
}) {
  const session = await db.query.tutorSessions.findFirst({
    where: eq(tutorSessions.executionId, executionId),
  });

  if (
    !session ||
    session.tutorId !== tutorId ||
    session.tokenHash !== (await hashSecret(token))
  ) {
    // the token of a session is replaced when it is resumed with a link
    throw new Error(SESSION_REPLACED_ERROR);
  }

  if (isSessionExpired(session.lastActiveAt)) {
    throw new Error(SESSION_EXPIRED_ERROR);
  }

  if (touch) {
    await db
      .update(tutorSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(tutorSessions.executionId, executionId));
  }

  return session;
}
