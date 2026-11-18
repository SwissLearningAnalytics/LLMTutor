// errors the student's browser reacts to, they are passed on as the message of the error
export const SESSION_REPLACED_ERROR = "TUTOR_SESSION_REPLACED";
export const SESSION_EXPIRED_ERROR = "TUTOR_SESSION_EXPIRED";

export type SessionEndReason = "replaced" | "expired";

export function getSessionEndReason(
  error: unknown,
): SessionEndReason | undefined {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes(SESSION_REPLACED_ERROR)) {
    return "replaced";
  }
  if (message.includes(SESSION_EXPIRED_ERROR)) {
    return "expired";
  }
  return undefined;
}
