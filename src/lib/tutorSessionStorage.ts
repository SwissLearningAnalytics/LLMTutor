import type { TutorSessionCredentials } from "@/lib/api/tutor-sessions";

// sessionStorage is kept per tab, so a reload continues the session but the next student on the same computer starts a new one
export type TutorSessionDraft = {
  userAnswer: string;
  reflectionOnChatbotFeedback: Record<string, string | undefined>;
  reflectionOnOwnAnswer: Record<string, string | undefined>;
};

export type StoredTutorSession = TutorSessionCredentials & {
  draft?: TutorSessionDraft;
};

function storageKey(tutorId: string) {
  return `tutor-session:${tutorId}`;
}

// sessionStorage can throw, e.g. if it is blocked. The tutor still works then, just without resuming
export function readTutorSession(tutorId: string): StoredTutorSession | null {
  try {
    const stored = sessionStorage.getItem(storageKey(tutorId));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function writeTutorSession(
  tutorId: string,
  session: StoredTutorSession,
) {
  try {
    sessionStorage.setItem(storageKey(tutorId), JSON.stringify(session));
  } catch {}
}

export function clearTutorSession(tutorId: string) {
  try {
    sessionStorage.removeItem(storageKey(tutorId));
  } catch {}
}
