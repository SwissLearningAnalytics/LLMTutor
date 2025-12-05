import { addMessage } from "@/lib/api/messages";
import { Role } from "@/lib/types/role";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";

export async function submitUserAnswerWithFeedback({
  event,
  promptName,
  pseudonym,
  model,
  executionId,
  userAnswer,
  reflectionOnChatbotFeedback,
  messages,
  setMessages,
  mode,
}: {
  event: React.FormEvent;
  promptName: string;
  pseudonym: string;
  model?: string;
  executionId: string;
  userAnswer: string;
  reflectionOnChatbotFeedback: Record<string, string | undefined>;
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  mode: string;
}) {
  event.preventDefault();

  try {
    await addMessage({
      data: {
        pseudonym,
        executionId,
        promptName: promptName,
        modelName: model,
        role: Role.User,
        message: userAnswer,
        feedback: reflectionOnChatbotFeedback,
        mode,
      },
    });

    setMessages([
      ...messages,
      {
        id: nanoid(),
        role: Role.User,
        content: userAnswer,
        parts: [
          {
            type: "text",
            text: userAnswer,
          },
        ],
      },
    ]);
  } catch (error) {
    throw Error("Error saving answer from user and feedback:", error as Error);
  }
}

export async function submitSecondFeedback({
  pseudonym,
  promptName,
  executionId,
  model,
  messages,
  reflectionOnOwnAnswer,
  mode,
}: {
  pseudonym: string;
  promptName: string;
  executionId: string;
  model?: string;
  messages: { content: string }[];
  reflectionOnOwnAnswer: Record<string, string | undefined>;
  mode: string;
}) {
  try {
    await addMessage({
      data: {
        pseudonym: pseudonym,
        promptName: promptName,
        executionId: executionId,
        modelName: model,
        role: Role.Ai,
        message: messages[messages.length - 1].content,
        feedback: reflectionOnOwnAnswer,
        mode,
      },
    });
  } catch (error) {
    throw Error(
      "Error saving message from AI and feedback from user:",
      error as Error,
    );
  }
}
