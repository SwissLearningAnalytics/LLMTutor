import type { UIMessage } from "ai";

export const START_CONVERSATION_INSTRUCTION = "Beginne die Unterhaltung.";

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
