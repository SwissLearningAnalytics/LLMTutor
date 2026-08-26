import type { UIMessage } from "ai";
import { addMessage } from "@/lib/api/messages";

export async function submitUserAnswerWithFeedback({
  event,
  promptName,
  pseudonym,
  model,
  executionId,
  userAnswer,
  reflectionOnChatbotFeedback,
  mode,
}: {
  event: React.FormEvent;
  promptName: string;
  pseudonym: string;
  model?: string;
  executionId: string;
  userAnswer: string;
  reflectionOnChatbotFeedback: Record<string, string | undefined>;
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
        role: "user",
        message: userAnswer,
        feedback: reflectionOnChatbotFeedback,
        mode,
      },
    });
  } catch (error) {
    throw Error("Error saving answer from user and feedback:", error as Error);
  }
}

export async function submitSecondFeedback({
  pseudonym,
  promptName,
  executionId,
  model,
  message,
  reflectionOnOwnAnswer,
  mode,
}: {
  pseudonym: string;
  promptName: string;
  executionId: string;
  model?: string;
  message: UIMessage;
  reflectionOnOwnAnswer: Record<string, string | undefined>;
  mode: string;
}) {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  try {
    await addMessage({
      data: {
        pseudonym: pseudonym,
        promptName: promptName,
        executionId: executionId,
        modelName: model,
        role: "ai",
        message: text,
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
