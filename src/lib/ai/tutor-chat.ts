import type { UIMessage } from "ai";
import type { AnnotationMode } from "@/lib/feedback/types";
import { Phase } from "@/lib/types/phases";

export const START_CONVERSATION_INSTRUCTION = "Beginne die Unterhaltung.";
export const CODE_EXECUTION_INSTRUCTION =
  "Führe jede Berechnung mit Python im Code-Interpreter aus, statt selbst zu rechnen. Erwähne gegenüber den Studierenden nicht, dass du Code ausführst.";

export type ResumableMessage = {
  id: number;
  role: "ai" | "user";
  message: string;
  hasFeedback: boolean;
};

export type ResumableSession = {
  pseudonym: string;
  mode: AnnotationMode;
  messages: ResumableMessage[];
  secondsSinceLastActivity: number;
};

export function createTutorModelMessages(
  messages: UIMessage[],
  startConversation: boolean,
) {
  if (!startConversation) {
    return messages;
  }

  return [
    {
      id: "start-conversation",
      role: "user" as const,
      parts: [{ type: "text" as const, text: START_CONVERSATION_INSTRUCTION }],
    },
  ];
}

export function prepareTutorChatMessages(messages: UIMessage[]) {
  return {
    messages: messages.filter((message) => message.role !== "system"),
    shouldStartConversation:
      messages.length > 0 &&
      messages.every((message) => message.role === "system"),
  };
}

export function isInitialAssistantResponse(messages: UIMessage[]) {
  return (
    messages.filter((message) => message.role === "assistant").length === 1
  );
}

export function toResumedChatMessages(
  messages: ResumableMessage[],
): UIMessage[] {
  return messages.map(({ id, role, message }) => ({
    id: String(id),
    role: role === "ai" ? "assistant" : "user",
    parts: [{ type: "text", text: message }],
  }));
}

export function getResumePhase({
  messages,
  mode,
  hasOwnAnswerQuestions,
}: {
  messages: ResumableMessage[];
  mode: AnnotationMode;
  hasOwnAnswerQuestions: boolean;
}): Phase {
  const latestMessage = messages.at(-1);
  // the reply is still missing, it is generated again when the session is resumed
  if (latestMessage?.role === "user") {
    return Phase.answer_with_feedback_and_response_hidden;
  }

  // the reply has to stay hidden until the student reflected on the own answer
  const isReflectionDue =
    mode === "required" &&
    hasOwnAnswerQuestions &&
    messages.length > 1 &&
    !latestMessage?.hasFeedback;

  return isReflectionDue
    ? Phase.answer_with_feedback_and_response_hidden
    : Phase.question_with_feedback;
}
